# Individual subscription (Google Play Billing)

Everything in the Individual section is paid, except the first lesson of
each course. This file lists what the code expects and what has to be set up
outside the code before the update goes to Play.

## How it works

1. The app (`lib/billing/entitlement.dart`) asks Google Play for the
   subscription `imaan_individual` and shows its plans on the paywall
   (`lib/billing/paywall.dart`). A grown-up check comes before every
   purchase.
2. After a purchase or restore, the app sends the Play purchase token to the
   Cloud Function `verifyPlaySubscription` (`functions/play-billing.js`).
3. The function asks Google Play (Android Publisher API,
   `purchases.subscriptionsv2.get`) whether the token is active. A cancelled
   subscription keeps access until its paid period ends.
4. For signed-in learners it writes `entitlements/{uid}` (readable by that
   learner only) and keeps the raw token in `play_tokens/{sha256}` (server
   only). Guests are checked without writing anything.
5. The app trusts the server's answer. If the server cannot be reached, the
   purchase is trusted for now and checked again next launch.

## Set up once (Play Console and Google Cloud)

1. **Create the subscription.** Play Console → the app (`com.imaanakhlaq`) →
   Monetize → Products → Subscriptions → Create subscription.
   - Product ID: `imaan_individual` (must match exactly).
   - Add two base plans: one monthly (auto-renewing, 1 month) and one
     yearly (auto-renewing, 1 year). Set prices in PKR and other countries.
   - Prices chosen on 16 Nov 2026: Pakistan Rs 250 a month and Rs 2,999 a
     year; everywhere else US$13 a month and US$100 a year (set the USD
     price as the default and let Play convert it, then override Pakistan).
   - Activate both base plans.
2. **Let the server read purchases.** Play Console → Users and permissions →
   Invite new users → the Cloud Functions service account
   `373650938167-compute@developer.gserviceaccount.com` (the runtime account
   of 2nd-gen functions) → App permissions for Imaan Akhlaq only: "View
   financial data" and "Manage orders and subscriptions".
3. **Turn on the API.** Google Cloud Console → APIs & Services → enable
   "Google Play Android Developer API" for the Firebase project.
4. **Node 22.** Google retired Node.js 20 for Cloud Functions on 30 Oct
   2026, so `functions/package.json` now asks for Node 22. Every function
   moves to Node 22 the next time it is deployed.
5. **Deploy** the function and the new Firestore rules (sections 16):
   `firebase deploy --only functions:verifyPlaySubscription,firestore:rules`
6. **Test before release.** Upload the AAB to Internal testing, add your Gmail
   under Settings → License testing, install from the testing link, and buy
   with the test card. Check that lesson 2 opens, that Restore works after a
   reinstall, and that `entitlements/{uid}` appears for a signed-in learner.

## Still to do later

- Real-time developer notifications (Pub/Sub) so refunds and cancellations
  are seen without waiting for the next app launch.
- Families policy: purchases are behind a grown-up check; keep the store
  listing and Data safety form in line with that.
