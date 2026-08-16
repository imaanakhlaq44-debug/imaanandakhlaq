/**
 * Module 3 — the Value Economy.
 *
 * Module 2 (src/lib/clubData.ts) pays a flat ten credits for a daily habit a
 * student ticks themselves. This module is the other half the concept asks
 * for: larger, one-off acts worth 20 to 100 credits, entered with a written
 * account and awarded by the Values Council rather than claimed.
 *
 * Two things in here are not free to drift:
 *
 * 1. THE POINTS BELOW ARE A SEED, NOT THE PRICE. The concept is explicit that
 *    points must be changeable from the admin panel and never hard-coded, so
 *    the live value of a category lives in /credit_categories in Firestore and
 *    the callable reads it from there. This table is only what a school starts
 *    with before anybody has edited anything. Never price an award from this
 *    file at runtime — see awardableCategories() in functions/index.js.
 *
 * 2. The scale is a scale. Every value here is one of 20 / 40 / 50 / 60 / 100,
 *    the five steps the concept deck already uses, because a category priced
 *    off the scale is how one act quietly becomes worth more than a month of
 *    house duty. What each step means:
 *
 *      20  — a small routine courtesy or contribution
 *      40  — meaningful help given to one person
 *      50  — organising something on behalf of others
 *      60  — moral courage, where speaking or abstaining costs something
 *      100 — thirty days of sustained consistency
 */

export interface ValueCategory {
  /** Stable across renames — written into every credit_entry document. */
  id: string;
  name: string;
  /** Urdu name. The portal is bilingual and the Council reads Urdu. */
  nameUr: string;
  /** What earns it, in the student's words. */
  example: string;
  exampleUr: string;
  /** Seed value only. The live price lives in /credit_categories. */
  points: number;
  /** Which house's virtue this act belongs to, for the standings. */
  house: 'sidq' | 'amanah' | 'rahmah' | 'adl';
}

/** The five steps a category may be priced at. Enforced by a test. */
export const VALUE_POINT_SCALE = [20, 40, 50, 60, 100];

/**
 * The floor and ceiling on a Values Council penalty.
 *
 * The Council chooses the size when it files, rather than every complaint
 * costing the same: a house that let one greeting slide has not done what a
 * house that covered up an injustice did. The bounds are the scale's own ends,
 * so a penalty can never exceed the largest thing a student can earn.
 */
export const COMPLAINT_MIN_POINTS = 10;
export const COMPLAINT_MAX_POINTS = 100;

/** Longest reason the Council may attach. A complaint has to be readable. */
export const COMPLAINT_REASON_MAX = 500;

/**
 * Shortest reason the Council must write.
 *
 * A house loses points for something one member did, and every other member
 * will ask why. A complaint that cannot answer that should not be filed, which
 * is the same bargain REFLECTION_MIN strikes with the student.
 */
export const COMPLAINT_REASON_MIN = 60;

/**
 * The six categories the concept deck ships with, plus the six conduct rules
 * the school added. They sit in one table because the Council prices and
 * awards them the same way; the ones the deck named are marked so a later
 * reader can tell what came from where.
 */
export const VALUE_CATEGORIES: ValueCategory[] = [
  // ── From the concept deck ────────────────────────────────────────────
  {
    id: 'initiative_leadership',
    name: 'Initiative & Leadership',
    nameUr: 'پہل اور قیادت',
    example: 'Organise a school cleanliness drive',
    exampleUr: 'اسکول صفائی مہم منظم کرنا',
    points: 50,
    house: 'amanah'
  },
  {
    id: 'academic_empathy',
    name: 'Academic Empathy',
    nameUr: 'تعلیمی ہمدردی',
    example: 'Teach a classmate who is falling behind',
    exampleUr: 'کمزور ساتھی کو پڑھانا',
    points: 40,
    house: 'rahmah'
  },
  {
    id: 'integrity_justice',
    name: 'Integrity & Justice',
    nameUr: 'دیانت اور عدل',
    example: 'Report an injustice, with evidence',
    exampleUr: 'ناانصافی کی ثبوت کے ساتھ اطلاع',
    points: 60,
    house: 'adl'
  },
  {
    id: 'compassion',
    name: 'Compassion',
    nameUr: 'رحم دلی',
    example: 'Run a drive for someone in need',
    exampleUr: 'ضرورت مند کے لیے مہم',
    points: 50,
    house: 'rahmah'
  },
  {
    id: 'consistency',
    name: 'Consistency',
    nameUr: 'استقامت',
    example: '30 days of unbroken house duty',
    exampleUr: '۳۰ دن مسلسل ہاؤس ڈیوٹی',
    points: 100,
    house: 'amanah'
  },
  {
    id: 'reflection_contribution',
    name: 'Reflection & Contribution',
    nameUr: 'غور و فکر اور حصہ',
    example: 'Submit a story or piece of writing to the portal',
    exampleUr: 'کہانی/تحریر پورٹل پر جمع کرانا',
    points: 20,
    house: 'sidq'
  },

  // ── The school's conduct code ────────────────────────────────────────
  // Priced against the six above rather than invented: keeping your own room
  // tidy is the routine end of the same virtue whose campaign-organising end
  // is worth 50, and standing clear of injustice asks the same of a student
  // as reporting one does.
  {
    id: 'clean_classroom',
    name: 'Keep your classroom clean',
    nameUr: 'اپنے کلاس کو صاف رکھنا',
    example: 'Leave your classroom in better order than you found it',
    exampleUr: 'اپنی کلاس کو اس سے بہتر حالت میں چھوڑنا جیسی آپ نے پائی',
    points: 20,
    house: 'amanah'
  },
  {
    id: 'help_struggling_peer',
    name: 'Help a struggling classmate fully',
    nameUr: 'کمزور ساتھی کی بھرپور مدد کرنا',
    example: 'Stay with a classmate who is struggling until they have understood',
    exampleUr: 'کمزور ساتھی کے ساتھ اس وقت تک رہنا جب تک وہ سمجھ نہ جائے',
    points: 40,
    house: 'rahmah'
  },
  {
    id: 'avoid_injustice',
    name: 'Avoid injustice and harm no one',
    nameUr: 'ناانصافی سے بچنا اور کسی کو تکلیف نہ پہنچانا',
    example: 'Step back from something unfair, or from hurting someone, when it would have been easy not to',
    exampleUr: 'کسی ناانصافی یا کسی کو تکلیف دینے سے رک جانا، جب رکنا آسان نہ تھا',
    points: 60,
    house: 'adl'
  },
  {
    id: 'clean_speech',
    name: 'Keep your language clean',
    nameUr: 'بری زبان کا استعمال نہ کرنا',
    example: 'Get through the day without a word you would not repeat to your mother',
    exampleUr: 'پورا دن ایسا لفظ نہ کہنا جو آپ اپنی ماں کے سامنے نہ دہرا سکیں',
    points: 20,
    house: 'sidq'
  },
  {
    id: 'greet_with_salaam',
    name: 'Greet one another with salaam',
    nameUr: 'ایک دوسرے کو ملنے پر سلام کرنا',
    example: 'Give salaam first, to everyone you meet',
    exampleUr: 'ہر ملنے والے کو پہلے سلام کرنا',
    points: 20,
    house: 'rahmah'
  },
  {
    id: 'respect_teacher',
    name: 'Respect your teacher and speak well',
    nameUr: 'استاد کا احترام کرنا اور اچھے سے بات کرنا',
    example: 'Speak to your teacher the way you would want to be spoken to',
    exampleUr: 'استاد سے ایسے بات کرنا جیسے آپ چاہتے ہیں آپ سے کی جائے',
    points: 40,
    house: 'amanah'
  }
];

/** Every category id that exists, for validating what a client sends. */
export const VALUE_CATEGORY_IDS: string[] = VALUE_CATEGORIES.map((c) => c.id);

/**
 * Shortest account a student must write with an entry.
 *
 * Same floor and same reason as a habit reflection: the Council is being asked
 * to award up to a hundred credits, and it cannot do that on a category name.
 */
export const ENTRY_DESCRIPTION_MIN = 60;

/**
 * A Council penalty is written to the same house_scores document the habit
 * approvals credit — see houseScoreId() in src/lib/clubData.ts. Deliberately
 * not a table of its own: a penalty recorded anywhere else would leave a house
 * sitting at the top of a standings table it had just been penalised out of.
 *
 * Unlike habit logs, credit entries take generated ids. A habit is one per
 * student per day and the id enforces that; a student may earn the same value
 * category many times in a term, and a deterministic id would silently
 * overwrite the last one.
 */

/**
 * Helpers for the inline dashboard scripts. Embed inside a
 * <script type="module"> block:  ${raw(valueEconomyHelpersJS)}
 *
 * Same arrangement as clubHelpersJS — the dashboards run their Firebase code
 * in inline modules with CDN imports and cannot import this file at runtime,
 * so the table is interpolated as data rather than re-typed.
 */
export const valueEconomyHelpersJS = `
  const VALUE_CATEGORIES = ${JSON.stringify(VALUE_CATEGORIES)};
  const VALUE_ENTRY_MIN = ${ENTRY_DESCRIPTION_MIN};
  const VALUE_COMPLAINT_MIN_POINTS = ${COMPLAINT_MIN_POINTS};
  const VALUE_COMPLAINT_MAX_POINTS = ${COMPLAINT_MAX_POINTS};
  const VALUE_COMPLAINT_REASON_MIN = ${COMPLAINT_REASON_MIN};

  /**
   * The seed table, keyed by id. Used for names and examples only — a live
   * price always comes from the /credit_categories document, because an admin
   * may have changed it and this copy would then be quietly wrong.
   */
  const VALUE_CATEGORY_BY_ID = VALUE_CATEGORIES.reduce((acc, c) => {
    acc[c.id] = c; return acc;
  }, {});

  function valueCategory(id) {
    return VALUE_CATEGORY_BY_ID[id] || null;
  }
`;
