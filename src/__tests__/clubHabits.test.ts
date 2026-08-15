import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  CLUB_HOUSES,
  HOUSE_IDS,
  ALL_HABIT_IDS,
  HABIT_VC,
  REFLECTION_MIN,
  reflectionKey,
  houseScoreId,
  clubHelpersJS
} from '../lib/clubData'

/**
 * functions/ is a separate package with no build step, so it cannot import
 * clubData.ts and keeps its own copy of the habit prices. Duplication that
 * nothing checks is duplication that drifts: a habit added to the web app but
 * missing from the function would be un-approvable, and the only symptom
 * would be a mentor clicking approve and nothing happening.
 *
 * This reads the map straight out of the deployed source rather than
 * importing it, because requiring functions/index.js would initialise the
 * Admin SDK.
 */
function functionsHabitMap(): Record<string, number> {
  const source = readFileSync(resolve(__dirname, '../../functions/index.js'), 'utf-8')
  const block = /const CLUB_HABIT_VC = \{([\s\S]*?)\};/.exec(source)
  if (!block) {
    throw new Error('CLUB_HABIT_VC not found in functions/index.js — did it get renamed?')
  }
  const map: Record<string, number> = {}
  for (const line of block[1].split('\n')) {
    const entry = /^\s*(\w+):\s*(\d+),?\s*$/.exec(line)
    if (entry) map[entry[1]] = Number(entry[2])
  }
  return map
}

/**
 * admin-dashboard.html is served as a static file and cannot import clubData
 * either, so it keeps its own copy of the four colours. A badge there in a
 * colour the student dashboard does not use is the kind of drift nobody
 * reports as a bug — it just quietly makes the houses look like two systems.
 */
function adminHouseMeta(): Record<string, { color: string; ink: string }> {
  const source = readFileSync(resolve(__dirname, '../../public/admin-dashboard.html'), 'utf-8')
  const block = /const CLUB_HOUSE_META = \{([\s\S]*?)\};/.exec(source)
  if (!block) {
    throw new Error('CLUB_HOUSE_META not found in admin-dashboard.html — did it get renamed?')
  }
  const meta: Record<string, { color: string; ink: string }> = {}
  for (const line of block[1].split('\n')) {
    const entry = /^\s*(\w+):\s*\{.*color:\s*'(#\w+)'.*ink:\s*'(#\w+)'/.exec(line)
    if (entry) meta[entry[1]] = { color: entry[2], ink: entry[3] }
  }
  return meta
}

/** WCAG relative luminance of a #rrggbb colour. */
function luminance(hex: string): number {
  const channel = (i: number) => {
    const v = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2)
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * The house_scores document key exists in three places: this module, the
 * dashboards' inline copy in clubHelpersJS, and the callable that writes the
 * documents. If they ever disagree the dashboards read ids nobody writes —
 * which surfaces as every house sitting on zero forever, not as an error.
 */
function normalisedExpr(source: string, pattern: RegExp, what: string): string {
  const found = pattern.exec(source)
  if (!found) throw new Error(what + ' not found — did it get renamed?')
  return found[1].replace(/\s+/g, '')
}

describe('Club reflection floor', () => {
  it('is the same number in the rules and in the callable', () => {
    // Three enforcement points. If the rules floor drifts below this one a
    // client can file a reflection the callable will then refuse to pay for,
    // and the student is left ticking habits that silently never approve.
    const rules = readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf-8')
    const inRules = /reflection_text\.size\(\) >= (\d+)/.exec(rules)
    expect(inRules, 'reflection floor not found in firestore.rules').toBeTruthy()
    expect(Number(inRules![1])).toBe(REFLECTION_MIN)

    const fns = readFileSync(resolve(__dirname, '../../functions/index.js'), 'utf-8')
    const inFns = /const REFLECTION_MIN = (\d+);/.exec(fns)
    expect(inFns, 'REFLECTION_MIN not found in functions/index.js').toBeTruthy()
    expect(Number(inFns![1])).toBe(REFLECTION_MIN)
  })
})

describe('Club reflection fingerprint', () => {
  const EXPECTED = "String(text||'').toLowerCase().replace(/\\s+/g,'').trim().slice(0,200)"

  it('ignores the things a paste changes', () => {
    const once = reflectionKey('I told Ali the truth about the broken window.')
    expect(reflectionKey('  i told ali the TRUTH   about the broken window.  ')).toBe(once)
    expect(reflectionKey('I told Ali the truth\nabout the broken window.')).toBe(once)
  })

  it('does not treat two different reflections as the same', () => {
    expect(reflectionKey('I helped Sara with her maths homework today.'))
      .not.toBe(reflectionKey('I returned the book I borrowed last week.'))
  })

  it('is empty for an empty reflection, so a blank cannot match a blank', () => {
    expect(reflectionKey('')).toBe('')
    expect(reflectionKey('   ')).toBe('')
  })

  it('is computed the same way in the callable', () => {
    const source = readFileSync(resolve(__dirname, '../../functions/index.js'), 'utf-8')
    const expr = normalisedExpr(
      source,
      /function reflectionKey\(text\) \{\s*return ([^;]+);/,
      'reflectionKey in functions/index.js'
    )
    expect(expr).toBe(EXPECTED)
  })

  it('is computed the same way in the inline dashboard helper', () => {
    const expr = normalisedExpr(
      clubHelpersJS,
      /function clubReflectionKey\(text\) \{\s*return ([^;]+);/,
      'clubReflectionKey in clubHelpersJS'
    )
    expect(expr).toBe(EXPECTED)
  })
})

describe('Club house_scores key', () => {
  const EXPECTED = "(schoolId||'global')+'__'+house"

  it('builds scope__house, falling back to the global virtual house', () => {
    expect(houseScoreId('school123', 'sidq')).toBe('school123__sidq')
    expect(houseScoreId('', 'sidq')).toBe('global__sidq')
  })

  it('is built the same way in the callable that writes the documents', () => {
    const source = readFileSync(resolve(__dirname, '../../functions/index.js'), 'utf-8')
    const expr = normalisedExpr(
      source,
      /function houseScoreId\(schoolId, house\) \{\s*return ([^;]+);/,
      'houseScoreId in functions/index.js'
    )
    expect(expr).toBe(EXPECTED)
  })

  it('is built the same way in the inline dashboard helper', () => {
    const expr = normalisedExpr(
      clubHelpersJS,
      /function clubHouseScoreId\(schoolId, house\) \{\s*return ([^;]+);/,
      'clubHouseScoreId in clubHelpersJS'
    )
    expect(expr).toBe(EXPECTED)
  })
})

describe('Club house palette', () => {
  it('uses the same colour for a house everywhere it is drawn', () => {
    const fromAdmin = adminHouseMeta()
    const fromApp: Record<string, { color: string; ink: string }> = {}
    for (const id of HOUSE_IDS) {
      fromApp[id] = { color: CLUB_HOUSES[id].color, ink: CLUB_HOUSES[id].ink }
    }
    expect(fromAdmin).toEqual(fromApp)
  })

  it('keeps every house ink readable on its own colour', () => {
    // This is why `ink` exists at all: Sidq's gold cannot carry the white
    // lettering the other three take, and #fff hard-coded anywhere against a
    // house colour would go unnoticed until a mentor could not read a badge.
    for (const id of HOUSE_IDS) {
      const house = CLUB_HOUSES[id]
      expect(contrast(house.color, house.ink)).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe('Club habit table', () => {
  it('prices every habit the same in the web app and the callable', () => {
    const fromFunctions = functionsHabitMap()
    const fromApp: Record<string, number> = {}
    for (const house of Object.values(CLUB_HOUSES)) {
      for (const habit of house.habits) fromApp[habit.id] = habit.vc
    }
    expect(fromFunctions).toEqual(fromApp)
  })

  it('gives each of the four houses three daily habits', () => {
    expect(HOUSE_IDS).toHaveLength(4)
    for (const id of HOUSE_IDS) {
      expect(CLUB_HOUSES[id].habits).toHaveLength(3)
    }
  })

  it('keeps habit ids unique — the id is the document key', () => {
    expect(new Set(ALL_HABIT_IDS).size).toBe(ALL_HABIT_IDS.length)
  })

  it('names its own house in every habit id, so a log is readable raw', () => {
    for (const id of HOUSE_IDS) {
      for (const habit of CLUB_HOUSES[id].habits) {
        expect(habit.id.startsWith(id + '_')).toBe(true)
      }
    }
  })

  it('awards the same credits for every habit', () => {
    // No habit is worth more than another on purpose: pricing them differently
    // turns "which value do I practise" into "which pays best".
    for (const id of ALL_HABIT_IDS) {
      const habit = Object.values(CLUB_HOUSES)
        .flatMap((h) => h.habits)
        .find((h) => h.id === id)
      expect(habit?.vc).toBe(HABIT_VC)
    }
  })
})
