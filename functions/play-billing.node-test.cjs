const { test } = require('node:test');
const assert = require('node:assert/strict');
const { makeVerifyPlaySubscription, judge } = require('./play-billing.js');

class HttpsError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
const NOW = new Date('2026-11-16T12:00:00Z');
const TOKEN = 'token-' + 'x'.repeat(40);

function setup(body, { status = 200, fail = false } = {}) {
  const docs = new Map();
  const db = {
    collection: (c) => ({
      doc: (id) => ({
        set: async (data) => docs.set(`${c}/${id}`, { ...(docs.get(`${c}/${id}`) || {}), ...data }),
      }),
    }),
  };
  const calls = [];
  const verify = makeVerifyPlaySubscription({
    db,
    HttpsError,
    now: () => NOW,
    fetchSubscription: async (pkg, token) => {
      calls.push([pkg, token]);
      if (fail) throw new Error('network');
      return { status, body };
    },
  });
  return { verify, docs, calls };
}

const activeBody = {
  subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
  lineItems: [{ productId: 'imaan_individual', expiryTime: '2026-12-16T12:00:00Z' }],
};

test('an active Play subscription unlocks and is recorded for the account', async () => {
  const { verify, docs, calls } = setup(activeBody);
  const r = await verify({ auth: { uid: 'kid' }, data: { purchaseToken: TOKEN } });
  assert.equal(r.active, true);
  assert.deepEqual(calls, [['com.imaanakhlaq', TOKEN]]);
  const e = docs.get('entitlements/kid').individual;
  assert.equal(e.active, true);
  assert.equal(e.expiryTime, '2026-12-16T12:00:00.000Z');
  assert.equal(e.tokenHash.length, 64);
  assert.equal(JSON.stringify(e).includes(TOKEN), false, 'raw token never in the readable doc');
});

test('guests are verified without writing anything', async () => {
  const { verify, docs } = setup(activeBody);
  const r = await verify({ data: { purchaseToken: TOKEN } });
  assert.equal(r.active, true);
  assert.equal(docs.size, 0);
});

test('expired, unknown or other-product tokens do not unlock', async () => {
  assert.equal(judge({ subscriptionState: 'SUBSCRIPTION_STATE_EXPIRED', lineItems: [{ productId: 'imaan_individual', expiryTime: '2026-11-01T00:00:00Z' }] }, 'imaan_individual', NOW).active, false);
  assert.equal(judge(null, 'imaan_individual', NOW).active, false);
  assert.equal(judge({ subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE', lineItems: [{ productId: 'other', expiryTime: '2027-01-01T00:00:00Z' }] }, 'imaan_individual', NOW).active, false);
  assert.equal(judge({ subscriptionState: 'SUBSCRIPTION_STATE_ON_HOLD', lineItems: [{ productId: 'imaan_individual', expiryTime: '2027-01-01T00:00:00Z' }] }, 'imaan_individual', NOW).active, false);
});

test('a cancelled subscription keeps access until its paid period ends', () => {
  const body = { subscriptionState: 'SUBSCRIPTION_STATE_CANCELED', lineItems: [{ productId: 'imaan_individual', expiryTime: '2026-11-20T00:00:00Z' }] };
  assert.equal(judge(body, 'imaan_individual', NOW).active, true);
  assert.equal(judge(body, 'imaan_individual', new Date('2026-11-21T00:00:00Z')).active, false);
});

test('a token Play does not know is simply inactive', async () => {
  const { verify } = setup(null, { status: 404 });
  const r = await verify({ data: { purchaseToken: TOKEN } });
  assert.equal(r.active, false);
});

test('bad input and Play outages are clear errors', async () => {
  const { verify } = setup(activeBody);
  await assert.rejects(verify({ data: {} }), { code: 'invalid-argument' });
  await assert.rejects(verify({ data: { purchaseToken: TOKEN, productId: 'gold_coins' } }), { code: 'invalid-argument' });
  const down = setup(activeBody, { fail: true });
  await assert.rejects(down.verify({ data: { purchaseToken: TOKEN } }), { code: 'unavailable' });
});
