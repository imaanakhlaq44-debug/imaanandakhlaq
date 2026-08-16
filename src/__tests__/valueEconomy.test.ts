import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  VALUE_CATEGORIES,
  VALUE_CATEGORY_IDS,
  VALUE_POINT_SCALE,
  ENTRY_DESCRIPTION_MIN,
  COMPLAINT_MIN_POINTS,
  COMPLAINT_MAX_POINTS,
  COMPLAINT_REASON_MIN
} from '../lib/valueEconomy'
import { HOUSE_IDS } from '../lib/clubData'

/**
 * Module 3's table exists in more than one place and cannot be imported into
 * all of them: functions/ is a separate package with no build step, and the
 * Firestore rules are their own language. These tests are what keeps the
 * copies honest — a price edited in one file and forgotten in another is the
 * failure mode, and it is silent everywhere except here.
 */

const functionsSrc = readFileSync(resolve(__dirname, '../../functions/index.js'), 'utf-8')
const rulesSrc = readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf-8')

describe('value economy — the table itself', () => {
  it('gives every category a unique id', () => {
    expect(new Set(VALUE_CATEGORY_IDS).size).toBe(VALUE_CATEGORIES.length)
  })

  it('carries the six categories the concept deck named', () => {
    // Renaming or dropping one of these is a change to the published concept,
    // not a refactor, so it should have to be done deliberately here too.
    for (const id of [
      'initiative_leadership', 'academic_empathy', 'integrity_justice',
      'compassion', 'consistency', 'reflection_contribution'
    ]) {
      expect(VALUE_CATEGORY_IDS).toContain(id)
    }
  })

  it("carries the school's six conduct rules", () => {
    for (const id of [
      'clean_classroom', 'help_struggling_peer', 'avoid_injustice',
      'clean_speech', 'greet_with_salaam', 'respect_teacher'
    ]) {
      expect(VALUE_CATEGORY_IDS).toContain(id)
    }
  })

  it('prices every category on the scale, never between its steps', () => {
    // The whole point of a scale is that a reader can compare two categories
    // without being told how. A category priced at 35 is how one act quietly
    // becomes worth more than the concept ever said it was.
    for (const c of VALUE_CATEGORIES) {
      expect(VALUE_POINT_SCALE, c.id + ' is off the scale').toContain(c.points)
    }
  })

  it('files every category under a house that exists', () => {
    for (const c of VALUE_CATEGORIES) {
      expect(HOUSE_IDS, c.id + ' names an unknown house').toContain(c.house)
    }
  })

  it('gives every category both an English and an Urdu name', () => {
    // The Council reads Urdu and the portal is bilingual; a category that
    // reached the panel with a blank Urdu name would be unusable there.
    for (const c of VALUE_CATEGORIES) {
      expect(c.name.trim().length, c.id + ' has no English name').toBeGreaterThan(0)
      expect(c.nameUr.trim().length, c.id + ' has no Urdu name').toBeGreaterThan(0)
      expect(c.exampleUr.trim().length, c.id + ' has no Urdu example').toBeGreaterThan(0)
    }
  })

  it('never prices a category above what a single penalty may take', () => {
    // Otherwise one approved entry could put a house permanently out of reach
    // of the Council's largest available sanction.
    for (const c of VALUE_CATEGORIES) {
      expect(c.points).toBeLessThanOrEqual(COMPLAINT_MAX_POINTS)
    }
  })
})

describe('value economy — the duplicated copies agree', () => {
  /** Pull the seed map out of functions/index.js without executing it. */
  const seed = (() => {
    const block = functionsSrc.match(/const VALUE_CATEGORY_SEED = \{([\s\S]*?)\};/)
    if (!block) throw new Error('VALUE_CATEGORY_SEED not found in functions/index.js')
    const out: Record<string, number> = {}
    for (const line of block[1].split('\n')) {
      const m = line.match(/^\s*([a-z_]+):\s*(\d+)/)
      if (m) out[m[1]] = Number(m[2])
    }
    return out
  })()

  it('seeds exactly the categories the app knows about', () => {
    expect(Object.keys(seed).sort()).toEqual([...VALUE_CATEGORY_IDS].sort())
  })

  it('seeds every category at the price the app shows', () => {
    for (const c of VALUE_CATEGORIES) {
      expect(seed[c.id], c.id + ' is priced differently in functions/index.js').toBe(c.points)
    }
  })

  it('pins the description floor across the app, the rules and the callable', () => {
    expect(functionsSrc).toContain('const ENTRY_DESCRIPTION_MIN = ' + ENTRY_DESCRIPTION_MIN + ';')
    // The rules cannot import a constant, so the literal is checked instead.
    const floor = rulesSrc.match(/function hasEntryDescription\(data\)[\s\S]*?size\(\) >= (\d+)/)
    expect(floor, 'hasEntryDescription not found in firestore.rules').toBeTruthy()
    expect(Number(floor![1])).toBe(ENTRY_DESCRIPTION_MIN)
  })

  it('pins the complaint bounds across the app and the callable', () => {
    expect(functionsSrc).toContain('const COMPLAINT_MIN_POINTS = ' + COMPLAINT_MIN_POINTS + ';')
    expect(functionsSrc).toContain('const COMPLAINT_MAX_POINTS = ' + COMPLAINT_MAX_POINTS + ';')
    expect(functionsSrc).toContain('const COMPLAINT_REASON_MIN = ' + COMPLAINT_REASON_MIN + ';')
  })
})

describe('value economy — what the rules must never allow', () => {
  const entries = rulesSrc.match(/match \/credit_entries\/\{entryId\} \{[\s\S]*?\n    \}/)
  const complaints = rulesSrc.match(/match \/council_complaints\/\{complaintId\} \{[\s\S]*?\n    \}/)

  it('has a rules block for both new collections', () => {
    expect(entries, '/credit_entries block not found').toBeTruthy()
    expect(complaints, '/council_complaints block not found').toBeTruthy()
  })

  it('lets no client write its own award on an entry', () => {
    // The single line the whole module rests on. A student who can set
    // points_awarded is a student who mints their own credits, and the house
    // table stops measuring anything.
    for (const field of ['points_awarded', 'verified_by', 'verified_at']) {
      expect(entries![0]).toContain("!('" + field + "' in request.resource.data)")
    }
  })

  it('lets no client write a Council complaint at all', () => {
    // Not even the Council: a penalty against a whole house has to carry a
    // record of who filed it that the filer cannot revise afterwards.
    expect(complaints![0]).toMatch(/allow write: if false;/)
  })

  it('keeps the category prices out of every hand but HQ', () => {
    const cats = rulesSrc.match(/match \/credit_categories\/\{categoryId\} \{[\s\S]*?\n    \}/)
    expect(cats, '/credit_categories block not found').toBeTruthy()
    expect(cats![0]).toMatch(/allow write: if isSuper\(\);/)
  })
})
