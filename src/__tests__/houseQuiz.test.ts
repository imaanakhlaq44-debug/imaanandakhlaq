import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { HOUSE_QUIZ, QUIZ_ANSWER_KEY, QUIZ_QUESTION_IDS, houseQuizHelpersJS } from '../lib/houseQuiz'
import { HOUSE_IDS } from '../lib/clubData'

const functionsSrc = readFileSync(resolve(__dirname, '../../functions/index.js'), 'utf-8')

describe('house quiz — the questions', () => {
  it('offers all four houses in every question', () => {
    // Otherwise a house wins by appearing more often than the others, and the
    // quiz measures the question paper rather than the child.
    for (const q of HOUSE_QUIZ) {
      const houses = q.options.map((o) => o.house).sort()
      expect(houses, q.id + ' does not offer all four houses').toEqual([...HOUSE_IDS].sort())
    }
  })

  it('never puts the same house in the same position twice in a row', () => {
    // A child who works out that the first option is always Sidq is choosing a
    // badge, not answering a question.
    for (let i = 1; i < HOUSE_QUIZ.length; i++) {
      const prev = HOUSE_QUIZ[i - 1].options.map((o) => o.house)
      const here = HOUSE_QUIZ[i].options.map((o) => o.house)
      expect(here, HOUSE_QUIZ[i].id + ' repeats the previous order').not.toEqual(prev)
    }
  })

  it('gives every option both an English and an Urdu wording', () => {
    for (const q of HOUSE_QUIZ) {
      expect(q.prompt.trim().length, q.id + ' has no prompt').toBeGreaterThan(0)
      expect(q.promptUr.trim().length, q.id + ' has no Urdu prompt').toBeGreaterThan(0)
      for (const o of q.options) {
        expect(o.text.trim().length, q.id + '/' + o.id + ' has no text').toBeGreaterThan(0)
        expect(o.textUr.trim().length, q.id + '/' + o.id + ' has no Urdu text').toBeGreaterThan(0)
      }
    }
  })

  it('keeps option ids unique inside a question', () => {
    for (const q of HOUSE_QUIZ) {
      expect(new Set(q.options.map((o) => o.id)).size).toBe(q.options.length)
    }
  })

  it('can reach every house from some set of answers', () => {
    // With four houses and six questions, a house that no combination of
    // answers can win is a house nobody can ever join.
    for (const house of HOUSE_IDS) {
      const reachable = HOUSE_QUIZ.every((q) => q.options.some((o) => o.house === house))
      expect(reachable, 'no path into ' + house).toBe(true)
    }
  })
})

describe('house quiz — the answer key never leaves the server', () => {
  it('strips the house off every option sent to the browser', () => {
    // The single thing that keeps this a quiz rather than a house picker. If
    // the mapping ships in the page, a child can read it out of the source.
    expect(houseQuizHelpersJS).not.toMatch(/"house"/)
    for (const house of HOUSE_IDS) {
      expect(houseQuizHelpersJS, house + ' leaked into the page')
        .not.toContain('"' + house + '"')
    }
  })

  it('still ships every question and option the child has to answer', () => {
    for (const q of HOUSE_QUIZ) {
      expect(houseQuizHelpersJS).toContain(q.prompt)
      for (const o of q.options) expect(houseQuizHelpersJS).toContain(o.text)
    }
  })
})

describe('house quiz — the duplicated key agrees', () => {
  /** Pull QUIZ_ANSWER_KEY out of functions/index.js without executing it. */
  const serverKey = (() => {
    const block = functionsSrc.match(/const QUIZ_ANSWER_KEY = \{([\s\S]*?)\n\};/)
    if (!block) throw new Error('QUIZ_ANSWER_KEY not found in functions/index.js')
    const out: Record<string, Record<string, string>> = {}
    for (const line of block[1].split('\n')) {
      const m = line.match(/^\s*(q\d+):\s*\{(.*)\}/)
      if (!m) continue
      out[m[1]] = {}
      for (const pair of m[2].split(',')) {
        const p = pair.match(/\s*([a-z]+):\s*'([a-z]+)'/)
        if (p) out[m[1]][p[1]] = p[2]
      }
    }
    return out
  })()

  it('covers exactly the questions the app asks', () => {
    expect(Object.keys(serverKey).sort()).toEqual([...QUIZ_QUESTION_IDS].sort())
  })

  it('maps every option to the same house the app intended', () => {
    // An option that disagrees here sorts a child into a house whose answer
    // they never gave — and nothing else in the system would notice.
    for (const qid of QUIZ_QUESTION_IDS) {
      expect(serverKey[qid], qid + ' missing on the server').toBeTruthy()
      expect(serverKey[qid], qid + ' disagrees with src/lib/houseQuiz.ts')
        .toEqual(QUIZ_ANSWER_KEY[qid])
    }
  })
})
