// Server-side check of a Google Play subscription for the Individual
// section. The app sends the purchase token it received from Play; this
// asks Google Play (Android Publisher API, purchases.subscriptionsv2) whether
// it is really active, and records the answer for signed-in accounts.
//
// Setup (once): in Play Console → Users and permissions, invite the runtime
// service account of 2nd-gen functions, the Compute Engine default account
// (373650938167-compute@developer.gserviceaccount.com for imaan-app-1d2da), with
// "View financial data, orders and cancellation survey responses" and
// "Manage orders and subscriptions". No key file is needed: the function
// uses its own runtime credentials.
const { createHash } = require('node:crypto');

const PACKAGE_NAME = 'com.imaanakhlaq';
const PRODUCT_ID = 'imaan_individual';
const ACTIVE_STATES = new Set([
  'SUBSCRIPTION_STATE_ACTIVE',
  'SUBSCRIPTION_STATE_IN_GRACE_PERIOD',
]);

/** Calls Google Play with the function's own service-account credentials. */
function playFetcher() {
  let client;
  return async (packageName, token) => {
    if (!client) {
      const { GoogleAuth } = require('google-auth-library');
      client = await new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/androidpublisher'],
      }).getClient();
    }
    const url =
      'https://androidpublisher.googleapis.com/androidpublisher/v3/applications/' +
      encodeURIComponent(packageName) +
      '/purchases/subscriptionsv2/tokens/' +
      encodeURIComponent(token);
    try {
      const res = await client.request({ url });
      return { status: 200, body: res.data };
    } catch (e) {
      const status = e?.response?.status;
      if (status === 404 || status === 410 || status === 400) return { status, body: null };
      throw e;
    }
  };
}

/** Whether a subscriptionsv2 response grants access right now. */
function judge(body, productId, now) {
  if (!body) return { active: false, state: 'NOT_FOUND', expiryTime: null };
  const items = (body.lineItems || []).filter((i) => i.productId === productId);
  const expiries = items.map((i) => Date.parse(i.expiryTime)).filter((t) => !Number.isNaN(t));
  const expiry = expiries.length ? Math.max(...expiries) : null;
  const state = body.subscriptionState || 'SUBSCRIPTION_STATE_UNSPECIFIED';
  const stillPaid = expiry !== null && expiry > now.getTime();
  // A cancelled subscription keeps access until the paid period ends.
  const active =
    items.length > 0 &&
    stillPaid &&
    (ACTIVE_STATES.has(state) || state === 'SUBSCRIPTION_STATE_CANCELED');
  return { active, state, expiryTime: expiry === null ? null : new Date(expiry).toISOString() };
}

function makeVerifyPlaySubscription({
  db,
  HttpsError,
  fetchSubscription = playFetcher(),
  now = () => new Date(),
  packageName = PACKAGE_NAME,
}) {
  return async (request) => {
    const data = request.data || {};
    const token = data.purchaseToken;
    const productId = data.productId || PRODUCT_ID;
    if (typeof token !== 'string' || token.length < 10 || token.length > 4096) {
      throw new HttpsError('invalid-argument', 'A Play purchase token is required.');
    }
    if (productId !== PRODUCT_ID) {
      throw new HttpsError('invalid-argument', 'Unknown product.');
    }
    let reply;
    try {
      reply = await fetchSubscription(packageName, token);
    } catch (e) {
      console.error('verifyPlaySubscription: Play API failed', e?.message || e);
      throw new HttpsError('unavailable', 'Google Play could not be reached. Try again.');
    }
    const at = now();
    const result = judge(reply.body, productId, at);
    const uid = request.auth?.uid;
    if (uid) {
      const tokenHash = createHash('sha256').update(token).digest('hex');
      // Owner-readable summary; the raw token stays in a server-only doc so
      // renewals and refunds can be re-checked later.
      await db.collection('entitlements').doc(uid).set(
        {
          individual: {
            active: result.active,
            productId,
            state: result.state,
            expiryTime: result.expiryTime,
            tokenHash,
            verifiedAt: at.toISOString(),
          },
        },
        { merge: true },
      );
      await db.collection('play_tokens').doc(tokenHash).set(
        { uid, productId, purchaseToken: token, lastState: result.state, verifiedAt: at.toISOString() },
        { merge: true },
      );
    }
    return result;
  };
}

module.exports = { makeVerifyPlaySubscription, judge, PRODUCT_ID, PACKAGE_NAME };
