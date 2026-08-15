/**
 * Imaan Akhlaq Club — the four houses and their daily micro-habits.
 *
 * This is the one place the club's content lives. It used to sit inline in
 * ClubPortal.tsx, where it was unreachable from anywhere else: the student
 * dashboard could not name a house and the teacher dashboard could not name
 * the habit it was approving. Three copies of the same table is how a habit
 * gets renamed in one place and silently keeps its old name in the approval
 * queue, so there is exactly one.
 *
 * The concept behind it: every student is a Naseer (protector) of their Raiah
 * (community), and each house exists to defeat one ethical "shadow". Character
 * is built by small daily actions, not by the monthly assembly — which is why
 * the unit of work here is a micro-habit logged per day, not an event.
 *
 * Like firebaseConfigJS and activeChildHelpersJS, the dashboards run their
 * Firebase code inside inline <script type="module"> blocks with CDN imports
 * and cannot import this file at runtime. Components interpolate the JSON and
 * the helper source instead.
 */

export interface ClubHabit {
  /** Stable across renames — it is written into every habit_log document. */
  id: string;
  name: string;
  desc: string;
  /** Value Credits awarded when a mentor approves this habit. */
  vc: number;
}

export interface ClubHouse {
  id: HouseId;
  icon: string;
  arabic: string;
  name: string;
  sub: string;
  motto: string;
  /** The force this house exists to defeat. */
  shadow: string;
  shadowDesc: string;
  /**
   * The house's identity colour. The hues are the concept deck's shield —
   * Sidq gold, Amanah green, Rahmah red, Adl navy — but every value is a
   * literal Imaan & Akhlaq brand token, so the houses sit inside the site's
   * palette rather than beside it. A house is recognised by its colour
   * before its name is read, so these are not free to drift.
   */
  color: string;
  /**
   * Text that sits directly on `color`. Gold is far too light to carry white
   * lettering, so Sidq takes dark ink and the other three take white — never
   * hard-code #fff against a house colour.
   */
  ink: string;
  resps: string[];
  habits: ClubHabit[];
}

export type HouseId = 'sidq' | 'amanah' | 'rahmah' | 'adl';

/** The only values users.house may hold. Rules and callables both enforce it. */
export const HOUSE_IDS: HouseId[] = ['sidq', 'amanah', 'rahmah', 'adl'];

/** Awarded per approved habit. Server-side only — see reviewHabitLogs. */
export const HABIT_VC = 10;

/**
 * Shortest reflection a student may file with a tick.
 *
 * The concept asks for twenty words, "so that it is not just a click". This
 * counts characters instead: word counting has to survive double spaces, line
 * breaks and Urdu text, and it has to be reimplemented identically in
 * Firestore rules, which are a poor place for that kind of care. A length
 * floor is blunt but it is exact, and it buys the same thing — a tick has to
 * cost a sentence.
 *
 * Mirrored in firestore.rules and functions/index.js; a test pins all three.
 */
export const REFLECTION_MIN = 60;

/**
 * A reflection reduced to what makes it the same reflection.
 *
 * Stored alongside the text as reflection_key so that repeats can be found by
 * comparing one field rather than re-normalising every log at read time. Case
 * and spacing are the two things a student changes when pasting the same
 * sentence again, so both are flattened; the cut at 200 characters keeps the
 * key small without letting a shared opening line count as a match on its own.
 *
 * Mirrored in functions/index.js — the callable trusts its own copy, never a
 * key the client sent, because a client that computes its own fingerprint can
 * simply compute a wrong one.
 */
export function reflectionKey(text: string): string {
  return String(text || '').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 200);
}

/**
 * Tier thresholds, lowest first. The label is what the student sees on their
 * badge; crossing a threshold is purely cosmetic and carries no permission.
 */
export const CLUB_TIERS = [
  { min: 200, label: 'Qaid', icon: '👑' },
  { min: 100, label: 'Naib Qaid', icon: '⚡' },
  { min: 50, label: 'Naseer', icon: '⚔️' },
  { min: 0, label: 'Junior Naseer', icon: '🌱' }
];

export const CLUB_HOUSES: Record<HouseId, ClubHouse> = {
  sidq: {
    id: 'sidq',
    icon: '⭐',
    arabic: 'الصِّدْق',
    name: 'House of Sidq',
    sub: 'Truthfulness',
    motto: '"We speak truth even when it costs us."',
    shadow: 'Kadhib — The Force of Deception',
    shadowDesc:
      'Dishonesty corrodes communities from within. Sidq attacks Kadhib by living the truth every single day.',
    // brand-gold
    color: '#F59E0B',
    ink: '#2B1E00',
    resps: [
      'Speaking truth in every situation, even when costly',
      'Fulfilling every promise made, without exception',
      'Using truth to hold yourself and others accountable'
    ],
    habits: [
      { id: 'sidq_daily_truth', name: 'Daily Truth', desc: 'Say one hard truth that needs to be said', vc: HABIT_VC },
      { id: 'sidq_own_it', name: 'Own It', desc: 'Acknowledge one mistake today without excuse', vc: HABIT_VC },
      { id: 'sidq_honest_mirror', name: 'Honest Mirror', desc: 'Give one friend a genuine, kind piece of feedback', vc: HABIT_VC }
    ]
  },
  amanah: {
    id: 'amanah',
    icon: '🛡️',
    arabic: 'الأمانة',
    name: 'House of Amanah',
    sub: 'Responsibility & Trust',
    motto: '"We carry every duty with honor."',
    shadow: 'Ghaflah — The Force of Negligence',
    shadowDesc:
      'Carelessness destroys trust. Amanah fights Ghaflah by taking every duty seriously — no matter how small.',
    // brand-teal
    color: '#0F5E55',
    ink: '#FFFFFF',
    resps: [
      'Fulfilling every duty without reminders',
      'Responsible care of shared resources',
      'Time responsibility and punctuality'
    ],
    habits: [
      { id: 'amanah_unprompted_duty', name: 'Unprompted Duty', desc: 'Complete one responsibility without being reminded', vc: HABIT_VC },
      { id: 'amanah_return_with_care', name: 'Return with Care', desc: 'Return something borrowed in better condition', vc: HABIT_VC },
      { id: 'amanah_on_time', name: 'On Time, Every Time', desc: 'Honor one time commitment without delay', vc: HABIT_VC }
    ]
  },
  rahmah: {
    id: 'rahmah',
    icon: '❤️',
    arabic: 'الرَّحْمَة',
    name: 'House of Rahmah',
    sub: 'Compassion & Kindness',
    motto: '"We leave no one behind."',
    shadow: 'Qasawah — The Force of Harshness',
    shadowDesc:
      'Cruelty and indifference isolate people. Rahmah defeats Qasawah through consistent, proactive acts of compassion.',
    // brand-pink
    color: '#D63678',
    ink: '#FFFFFF',
    resps: [
      'Proactively checking on isolated or struggling peers',
      'Offering help before being asked',
      'Speaking words of encouragement and kindness daily'
    ],
    habits: [
      { id: 'rahmah_lonely_outreach', name: 'Lonely Outreach', desc: 'Check on one person who seems isolated or sad', vc: HABIT_VC },
      { id: 'rahmah_proactive_help', name: 'Proactive Help', desc: 'Offer your help before being asked', vc: HABIT_VC },
      { id: 'rahmah_one_kind_word', name: 'One Kind Word', desc: 'Say something meaningful to someone struggling', vc: HABIT_VC }
    ]
  },
  adl: {
    id: 'adl',
    icon: '⚖️',
    arabic: 'الْعَدْل',
    name: 'House of Adl',
    sub: 'Fairness & Justice',
    motto: '"We stand for what is right, always."',
    shadow: 'Zulm — The Force of Injustice',
    shadowDesc:
      'Injustice silences the weak. Adl confronts Zulm by ensuring fairness in every group, activity, and interaction.',
    // brand-navy
    color: '#1E2D5A',
    ink: '#FFFFFF',
    resps: [
      'Ensuring fair play in all group activities',
      'Consistent rule-following and accountability',
      'Mediating conflict with justice and wisdom'
    ],
    habits: [
      { id: 'adl_speak_up', name: 'Speak Up', desc: 'Challenge one unfair situation you witness today', vc: HABIT_VC },
      { id: 'adl_fair_distribution', name: 'Fair Distribution', desc: 'Ensure equity in any group task or sharing', vc: HABIT_VC },
      { id: 'adl_defend_the_weak', name: 'Defend the Weak', desc: 'Stand up for someone being treated unjustly', vc: HABIT_VC }
    ]
  }
};

/**
 * Where a house's running total lives — one document per school, per house.
 *
 * Must produce exactly what houseScoreId() in functions/index.js produces:
 * that callable writes these documents and the dashboards read them straight
 * back by id, so a disagreement about the key would show every house sitting
 * on zero rather than raising an error. A school's houses are its own — Sidq
 * at one school does not compete with Sidq at another — and accounts with no
 * school share the global scope, the concept's Global Virtual House.
 */
export function houseScoreId(schoolId: string, house: string): string {
  return (schoolId || 'global') + '__' + house;
}

/** Every habit id that exists, for validating what a client sends. */
export const ALL_HABIT_IDS: string[] = Object.values(CLUB_HOUSES).flatMap((h) =>
  h.habits.map((x) => x.id)
);

/**
 * Helpers for the inline dashboard scripts. Embed inside a
 * <script type="module"> block:  ${raw(clubHelpersJS)}
 *
 * CLUB_HOUSES is embedded as data rather than re-typed, so the student
 * dashboard, the teacher queue and the club portal always agree.
 */
export const clubHelpersJS = `
  const CLUB_HOUSES = ${JSON.stringify(CLUB_HOUSES)};
  const CLUB_TIERS = ${JSON.stringify(CLUB_TIERS)};
  const CLUB_HOUSE_IDS = ${JSON.stringify(HOUSE_IDS)};
  const CLUB_REFLECTION_MIN = ${REFLECTION_MIN};

  /** Mirrors reflectionKey() — see the note on the exported version. */
  function clubReflectionKey(text) {
    return String(text || '').toLowerCase().replace(/\\s+/g, ' ').trim().slice(0, 200);
  }

  /**
   * The day a habit is logged against, as YYYY-MM-DD in the DEVICE's timezone.
   *
   * Deliberately not UTC: a student in Karachi ticking a habit at 9pm would
   * otherwise be filing it under tomorrow, and their "today" list would come
   * back empty. The server never recomputes this — it only ever reads back the
   * date the client wrote, so the two can never disagree about which day a log
   * belongs to.
   */
  function clubToday() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  /**
   * One log per student, per habit, per day — enforced by the document id
   * rather than by a query. A second tick of the same habit rewrites the same
   * document instead of minting a duplicate, so no amount of clicking (or of
   * two devices open at once) can bank the credits twice.
   */
  function clubLogId(studentUid, dateKey, habitId) {
    return studentUid + '_' + dateKey + '_' + habitId;
  }

  /** Mirrors houseScoreId() — see the note on the exported version. */
  function clubHouseScoreId(schoolId, house) {
    return (schoolId || 'global') + '__' + house;
  }

  function clubHouse(houseId) {
    return CLUB_HOUSES[houseId] || null;
  }

  function clubHabit(houseId, habitId) {
    const house = clubHouse(houseId);
    if (!house) return null;
    return house.habits.find((h) => h.id === habitId) || null;
  }

  /** Badge for a Value Credit total. Thresholds are highest-first. */
  function clubTier(vc) {
    const points = typeof vc === 'number' ? vc : 0;
    return CLUB_TIERS.find((t) => points >= t.min) || CLUB_TIERS[CLUB_TIERS.length - 1];
  }
`;
