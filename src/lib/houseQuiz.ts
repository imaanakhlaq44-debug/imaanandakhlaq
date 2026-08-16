/**
 * The house quiz — how a self-study member joins a house.
 *
 * A school allocates its students to houses from the admin panel. An
 * individual who signs up on their own has no school to do that, and until
 * this existed they landed on a club they could not enter: no house means no
 * habits, and the empty state told them to ask a teacher they do not have.
 *
 * Six situations, four ways to respond to each — one per house. The child
 * picks the response most like them, and the house they lean toward most is
 * the one they join.
 *
 * Two things are deliberate:
 *
 * 1. THE ANSWERS ARE NOT LABELLED WITH THEIR HOUSE. A child who can see that
 *    option B is Sidq is not answering a question about themselves, they are
 *    choosing a badge. The mapping lives here and on the server, never in the
 *    markup the child reads.
 *
 * 2. THE SCORING IS NOT DONE HERE. This file is the questions; the arithmetic
 *    runs in the assignHouseFromQuiz callable on the Admin SDK. A quiz scored
 *    in the browser is a quiz whose answer a child can simply post — and
 *    'house' is the one field the Firestore rules keep out of every client's
 *    hands, precisely so nobody sorts themselves into the house whose habits
 *    look easiest that week.
 */

import type { HouseId } from './clubData';

export interface QuizOption {
  id: string;
  text: string;
  /** Urdu — many self-study families read this first. */
  textUr: string;
  /** Never rendered. Mirrored in functions/index.js; a test pins the two. */
  house: HouseId;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  promptUr: string;
  options: QuizOption[];
}

/**
 * Every question offers all four houses, so no house can win by appearing
 * more often than the others. The order is shuffled question to question —
 * a child who works out that "the first one is always Sidq" is back to
 * choosing a badge.
 */
export const HOUSE_QUIZ: QuizQuestion[] = [
  {
    id: 'q1',
    prompt: 'Something gets broken in class, and the teacher asks who did it.',
    promptUr: 'کلاس میں کوئی چیز ٹوٹ جاتی ہے اور استاد پوچھتے ہیں کہ یہ کس نے کیا۔',
    options: [
      { id: 'a', house: 'sidq', text: 'I say what really happened, even if it is hard', textUr: 'میں سچ بتا دیتا ہوں، چاہے کہنا مشکل ہو' },
      { id: 'b', house: 'rahmah', text: 'I stay beside my friend so they are not alone in it', textUr: 'میں اپنے دوست کے ساتھ کھڑا رہتا ہوں تاکہ وہ اکیلا محسوس نہ کرے' },
      { id: 'c', house: 'amanah', text: 'I help repair or replace what was broken', textUr: 'میں ٹوٹی ہوئی چیز ٹھیک کرانے یا بدلوانے میں مدد کرتا ہوں' },
      { id: 'd', house: 'adl', text: 'I make sure the blame lands on the right person, not on everyone', textUr: 'میں دھیان رکھتا ہوں کہ الزام صحیح شخص پر آئے، سب پر نہیں' }
    ]
  },
  {
    id: 'q2',
    prompt: 'You borrowed something that belongs to someone else.',
    promptUr: 'آپ نے کسی اور کی چیز اُدھار لی ہے۔',
    options: [
      { id: 'a', house: 'amanah', text: 'I return it on time and in good condition, without being reminded', textUr: 'میں بغیر یاد دہانی کے، وقت پر اور اچھی حالت میں واپس کرتا ہوں' },
      { id: 'b', house: 'adl', text: 'I make sure everyone who wants it gets a fair turn', textUr: 'میں خیال رکھتا ہوں کہ جسے ضرورت ہو، سب کو باری ملے' },
      { id: 'c', house: 'sidq', text: 'If I damaged it, I say so myself before anyone notices', textUr: 'اگر مجھ سے خراب ہو جائے تو کسی کے پوچھنے سے پہلے خود بتا دیتا ہوں' },
      { id: 'd', house: 'rahmah', text: 'I lend it onward to whoever needs it more than me', textUr: 'جسے مجھ سے زیادہ ضرورت ہو، میں آگے اُسے دے دیتا ہوں' }
    ]
  },
  {
    id: 'q3',
    prompt: 'The teams for a game are uneven and one side will clearly lose.',
    promptUr: 'کھیل میں ٹیمیں برابر نہیں ہیں اور ایک طرف کا ہارنا صاف نظر آ رہا ہے۔',
    options: [
      { id: 'a', house: 'rahmah', text: 'I join the weaker side so they are not left behind', textUr: 'میں کمزور طرف شامل ہو جاتا ہوں تاکہ وہ پیچھے نہ رہ جائیں' },
      { id: 'b', house: 'adl', text: 'I speak up until the teams are made fair', textUr: 'میں اُس وقت تک بولتا ہوں جب تک ٹیمیں برابر نہ ہو جائیں' },
      { id: 'c', house: 'sidq', text: 'I admit it when my own side bends the rules', textUr: 'اگر میری اپنی طرف بے ایمانی کرے تو میں مان لیتا ہوں' },
      { id: 'd', house: 'amanah', text: 'I take charge of organising it properly', textUr: 'میں خود ذمہ داری لے کر اسے ٹھیک سے منظم کرتا ہوں' }
    ]
  },
  {
    id: 'q4',
    prompt: 'A classmate is sitting alone at break, again.',
    promptUr: 'ایک ساتھی وقفے میں پھر اکیلا بیٹھا ہے۔',
    options: [
      { id: 'a', house: 'adl', text: 'I find out whether someone is leaving them out, and stop it', textUr: 'میں پتا کرتا ہوں کہ کوئی اُسے الگ تو نہیں کر رہا، اور اسے روکتا ہوں' },
      { id: 'b', house: 'amanah', text: 'I check on them every day after that, not just once', textUr: 'میں اُس کے بعد روز خبر لیتا ہوں، صرف ایک دن نہیں' },
      { id: 'c', house: 'rahmah', text: 'I go and sit with them', textUr: 'میں جا کر اُس کے پاس بیٹھ جاتا ہوں' },
      { id: 'd', house: 'sidq', text: 'I ask them honestly whether something is wrong', textUr: 'میں کھل کر پوچھتا ہوں کہ کیا کوئی بات ہے' }
    ]
  },
  {
    id: 'q5',
    prompt: 'You promised to do something, and then forgot all about it.',
    promptUr: 'آپ نے کوئی وعدہ کیا تھا اور پھر بالکل بھول گئے۔',
    options: [
      { id: 'a', house: 'sidq', text: 'I tell them I forgot, instead of making an excuse', textUr: 'میں بہانہ بنانے کے بجائے بتا دیتا ہوں کہ میں بھول گیا تھا' },
      { id: 'b', house: 'amanah', text: 'I do it straight away, and set myself a reminder for next time', textUr: 'میں فوراً کر دیتا ہوں، اور اگلی بار کے لیے یاد دہانی رکھ لیتا ہوں' },
      { id: 'c', house: 'adl', text: 'I accept whatever consequence would be fair', textUr: 'جو بھی منصفانہ نتیجہ ہو، میں قبول کر لیتا ہوں' },
      { id: 'd', house: 'rahmah', text: 'I apologise properly and ask how I can make it right', textUr: 'میں ٹھیک سے معافی مانگتا ہوں اور پوچھتا ہوں کہ اب کیسے تلافی کروں' }
    ]
  },
  {
    id: 'q6',
    prompt: 'You watch someone being treated unfairly.',
    promptUr: 'آپ کے سامنے کسی کے ساتھ ناانصافی ہو رہی ہے۔',
    options: [
      { id: 'a', house: 'rahmah', text: 'I go to them afterwards so they know someone cares', textUr: 'میں بعد میں اُس کے پاس جاتا ہوں تاکہ اُسے لگے کوئی تو ہے' },
      { id: 'b', house: 'sidq', text: 'I report exactly what I saw, without adding to it', textUr: 'میں نے جو دیکھا بالکل وہی بتاتا ہوں، اس میں کچھ ملائے بغیر' },
      { id: 'c', house: 'amanah', text: 'I make sure it does not happen again where I am responsible', textUr: 'جہاں میری ذمہ داری ہو، میں دوبارہ ایسا نہیں ہونے دیتا' },
      { id: 'd', house: 'adl', text: 'I stand up for them right then, even if it is uncomfortable', textUr: 'میں اُسی وقت اُس کے لیے کھڑا ہو جاتا ہوں، چاہے مشکل ہو' }
    ]
  }
];

/** Every question must be answered — a half-filled quiz sorts nobody. */
export const QUIZ_QUESTION_IDS: string[] = HOUSE_QUIZ.map((q) => q.id);

/**
 * The answer key, in the shape the callable needs: question id → option id →
 * house. Mirrored in functions/index.js because functions/ cannot import a
 * .ts file; a test asserts the two agree.
 */
export const QUIZ_ANSWER_KEY: Record<string, Record<string, HouseId>> =
  HOUSE_QUIZ.reduce((acc, q) => {
    acc[q.id] = q.options.reduce((o, opt) => {
      o[opt.id] = opt.house;
      return o;
    }, {} as Record<string, HouseId>);
    return acc;
  }, {} as Record<string, Record<string, HouseId>>);

/**
 * Helpers for the inline dashboard script. Embed inside a
 * <script type="module"> block:  ${raw(houseQuizHelpersJS)}
 *
 * The house on each option is stripped before the questions are handed to the
 * browser. It is not needed there — the server scores the answers — and
 * shipping it would let a curious child read the answer key out of the page
 * source and pick their way into whichever house they liked.
 */
export const houseQuizHelpersJS = `
  const HOUSE_QUIZ = ${JSON.stringify(
    HOUSE_QUIZ.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      promptUr: q.promptUr,
      options: q.options.map((o) => ({ id: o.id, text: o.text, textUr: o.textUr }))
    }))
  )};
`;
