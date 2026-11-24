/**
 * Weekly habits report for parents, sent as a phone notification.
 *
 * A family that turned the report on in the app has one or more devices in
 * push_tokens/{token} (owner_uid = the family account, lang = 'en' | 'ur').
 * Every Sunday evening (Pakistan time) each such family gets one
 * notification summarising the last seven days of every child's daily
 * checklists (daily_checklists/{childUid}/days/{yyyy-mm-dd}).
 *
 * The text is built by pure functions so it can be tested without Firebase.
 */

const TIME_ZONE = 'Asia/Karachi';

/** What each checklist allows in a day, as in firestore.rules. */
const CHECKLISTS = [
  { id: 'salah', en: 'Salah', ur: 'نماز', perDay: 5 },
  { id: 'quran', en: 'Quran', ur: 'قرآن', perDay: 3 },
  { id: 'duas', en: 'Duas', ur: 'دعائیں', perDay: 6 },
  { id: 'hadith', en: 'Hadith', ur: 'حدیث', perDay: 2 },
  { id: 'deeds', en: 'Good deeds', ur: 'اچھے کام', perDay: 5 },
  { id: 'challenge', en: 'Weekly goal', ur: 'ہفتے کا ہدف', perDay: 1 },
];

/** Day key (yyyy-mm-dd) of [date] in Pakistan. */
function dayKeyIn(date, timeZone = TIME_ZONE) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}

/** The seven day keys ending on [now]'s day, oldest first. */
function lastSevenDays(now, timeZone = TIME_ZONE) {
  const keys = [];
  for (let i = 6; i >= 0; i--) {
    keys.push(dayKeyIn(new Date(now.getTime() - i * 86400000), timeZone));
  }
  return keys;
}

/**
 * Totals for one child: checklist id → ticks in the week, plus the days a
 * parent confirmed. [days] maps day key → the day's Firestore data.
 */
function summariseChild(days, weekKeys) {
  const totals = Object.fromEntries(CHECKLISTS.map((c) => [c.id, 0]));
  let confirmedDays = 0;
  for (const key of weekKeys) {
    const day = days[key];
    if (!day) continue;
    for (const c of CHECKLISTS) {
      if (Array.isArray(day[c.id])) totals[c.id] += day[c.id].length;
    }
    if (day.confirmed && typeof day.confirmed === 'object') confirmedDays++;
  }
  return { totals, confirmedDays };
}

/** One line per child, e.g. "Ayaan: Salah 28/35 · Quran 12". */
function childLine(name, summary, lang) {
  const ur = lang === 'ur';
  const parts = [];
  for (const c of CHECKLISTS) {
    const n = summary.totals[c.id];
    if (c.id === 'salah') {
      parts.push(`${ur ? c.ur : c.en} ${n}/${c.perDay * 7}`);
    } else if (c.id === 'challenge') {
      if (n > 0) parts.push(`${ur ? c.ur : c.en} ${n}/5`);
    } else if (n > 0) {
      parts.push(`${ur ? c.ur : c.en} ${n}`);
    }
  }
  const any = CHECKLISTS.some((c) => summary.totals[c.id] > 0);
  if (!any) {
    return ur
      ? `${name}: اس ہفتے کوئی نشان نہیں — حوصلہ بڑھائیں!`
      : `${name}: nothing ticked this week — a little encouragement helps!`;
  }
  return `${name}: ${parts.join(' · ')}`;
}

/** The notification a family receives. [children] = [{ name, summary }]. */
function buildMessage(children, lang) {
  const ur = lang === 'ur';
  return {
    title: ur ? 'ہفتہ وار رپورٹ' : 'Weekly habits report',
    body: children.length
      ? children.map((c) => childLine(c.name, c.summary, lang)).join('\n')
      : ur
        ? 'ابھی کوئی بچہ شامل نہیں۔'
        : 'No children are linked yet.',
  };
}

/** FCM errors that mean a device token will never work again. */
const DEAD_TOKEN = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

const APP_LINK = 'https://www.imaanakhlaq.org/app/';

/**
 * The report runner. [db] is an admin Firestore, [messaging] an admin
 * Messaging (or a test double with sendEachForMulticast).
 */
function makeWeeklyReport({ db, messaging }) {
  async function childrenOf(familyUid) {
    const snap = await db.collection('users')
      .where('family_uid', '==', familyUid).get();
    return snap.docs.map((d) => ({ uid: d.id, name: d.data().name || 'Child' }));
  }

  async function weekOf(childUid, weekKeys) {
    const snap = await db.collection('daily_checklists').doc(childUid)
      .collection('days')
      .where('__name__', '>=', db.collection('daily_checklists').doc(childUid)
        .collection('days').doc(weekKeys[0]))
      .get();
    const days = {};
    for (const d of snap.docs) days[d.id] = d.data();
    return days;
  }

  /** Sends one family's report to every device they turned it on for. */
  async function sendFamily(familyUid, tokens, now) {
    const family = await db.collection('users').doc(familyUid).get();
    if (!family.exists || family.data().role !== 'family') {
      return { sent: 0, removed: 0, skipped: true };
    }
    const weekKeys = lastSevenDays(now);
    const children = [];
    for (const child of await childrenOf(familyUid)) {
      children.push({
        name: child.name,
        summary: summariseChild(await weekOf(child.uid, weekKeys), weekKeys),
      });
    }
    let sent = 0;
    let removed = 0;
    // Devices may differ in language; send each language its own text.
    for (const lang of ['en', 'ur']) {
      const group = tokens.filter((t) => (t.lang === 'ur' ? 'ur' : 'en') === lang);
      if (!group.length) continue;
      const message = buildMessage(children, lang);
      const result = await messaging.sendEachForMulticast({
        tokens: group.map((t) => t.token),
        notification: message,
        webpush: { fcmOptions: { link: APP_LINK } },
      });
      sent += result.successCount;
      for (const [i, r] of result.responses.entries()) {
        if (!r.success && r.error && DEAD_TOKEN.has(r.error.code)) {
          await db.collection('push_tokens').doc(group[i].token).delete();
          removed++;
        }
      }
    }
    return { sent, removed, skipped: false };
  }

  /** Every family that turned the report on. */
  async function runAll(now = new Date()) {
    const snap = await db.collection('push_tokens').get();
    const byOwner = new Map();
    for (const d of snap.docs) {
      const owner = d.data().owner_uid;
      if (typeof owner !== 'string') continue;
      if (!byOwner.has(owner)) byOwner.set(owner, []);
      byOwner.get(owner).push({ token: d.id, lang: d.data().lang });
    }
    const totals = { families: 0, sent: 0, removed: 0 };
    for (const [owner, tokens] of byOwner) {
      try {
        const r = await sendFamily(owner, tokens, now);
        if (!r.skipped) totals.families++;
        totals.sent += r.sent;
        totals.removed += r.removed;
      } catch (e) {
        // One family's failure never stops the others.
        console.error('weekly report failed for a family', e);
      }
    }
    return totals;
  }

  /** The caller's own report, now (the "send me a test" button). */
  async function runOne(familyUid, now = new Date()) {
    const snap = await db.collection('push_tokens')
      .where('owner_uid', '==', familyUid).get();
    const tokens = snap.docs.map((d) => ({ token: d.id, lang: d.data().lang }));
    if (!tokens.length) return { sent: 0, removed: 0, skipped: true };
    return sendFamily(familyUid, tokens, now);
  }

  return { runAll, runOne };
}

module.exports = {
  CHECKLISTS,
  dayKeyIn,
  lastSevenDays,
  summariseChild,
  childLine,
  buildMessage,
  makeWeeklyReport,
};
