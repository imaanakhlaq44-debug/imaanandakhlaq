import { describe, it, expect } from 'vitest'
import { pullToRefreshJS, PULL_THRESHOLD, PULL_TO_REFRESH_PAGES } from '../lib/pullToRefresh'

/**
 * Pull to refresh runs only inside the Capacitor WebView, so nothing here or
 * in CI ever executed it — which is how it shipped reloading the page on an
 * ordinary scroll. Scrolling up through a long page ends with the content at
 * the top and a finger still moving down; that is what the old version could
 * not tell apart from a pull.
 *
 * iaPullDecision() is the whole of that judgement, and it is pulled out of the
 * emitted source here rather than copied, so this cannot pass while the app
 * does something else.
 */
const decision: (g: Record<string, unknown>) => string = (() => {
  const match = pullToRefreshJS.match(/function iaPullDecision\(g\) \{[\s\S]*?\n  \}/)
  if (!match) throw new Error('iaPullDecision not found in pullToRefreshJS')
  const constants = pullToRefreshJS.match(/var IA_PULL_THRESHOLD = \d+;/)
  // eslint-disable-next-line no-new-func
  return new Function(constants![0] + '\n' + match[0] + '\nreturn iaPullDecision;')() as any
})()

/** A gesture that would refresh, which each case then spoils in one way. */
function pull(overrides: Record<string, unknown> = {}) {
  return {
    startedAtTop: true,
    movedUp: false,
    horizontal: false,
    scrolled: false,
    multiTouch: false,
    overlayOpen: false,
    distance: PULL_THRESHOLD + 20,
    ...overrides
  }
}

describe('Pull to refresh — what counts as a pull', () => {
  it('refreshes on a deliberate downward pull from the top', () => {
    expect(decision(pull())).toBe('refresh')
  })

  it('does not refresh when the gesture began part way down the page', () => {
    // Scrolling up from the bottom: the content reaches the top mid-gesture
    // and the finger keeps travelling down. This is the one the old version
    // got wrong, and the whole reason the app reloaded under people.
    expect(decision(pull({ startedAtTop: false }))).toBe('scroll')
  })

  it('does not refresh once the finger has moved up at all', () => {
    expect(decision(pull({ movedUp: true }))).toBe('scroll')
  })

  it('does not refresh when the content scrolled during the gesture', () => {
    expect(decision(pull({ scrolled: true }))).toBe('scroll')
  })

  it('ignores a mostly sideways swipe', () => {
    expect(decision(pull({ horizontal: true }))).toBe('scroll')
  })

  it('ignores a two-finger gesture', () => {
    expect(decision(pull({ multiTouch: true }))).toBe('scroll')
  })

  it('never reloads the page out from under an open dialog', () => {
    expect(decision(pull({ overlayOpen: true }))).toBe('scroll')
  })

  it('treats a short pull as a cancel, not a refresh', () => {
    expect(decision(pull({ distance: 40 }))).toBe('cancel')
    expect(decision(pull({ distance: PULL_THRESHOLD - 1 }))).toBe('cancel')
    expect(decision(pull({ distance: PULL_THRESHOLD }))).toBe('refresh')
  })

  it('asks for a deliberate distance, not a flick', () => {
    // Low enough to feel responsive, far enough that a scroll flick — which
    // is typically 40-80px before the finger lifts — cannot reach it.
    expect(PULL_THRESHOLD).toBeGreaterThanOrEqual(120)
    expect(PULL_THRESHOLD).toBeLessThanOrEqual(200)
  })
})

describe('Pull to refresh — where it is offered', () => {
  it('is limited to the screens where reloading fetches work', () => {
    expect(PULL_TO_REFRESH_PAGES).toContain('teacher-dashboard')
    expect(PULL_TO_REFRESH_PAGES).toContain('family')
    // The student dashboard opted out: children scroll it hard, and a reload
    // there only ever costs them their place.
    expect(PULL_TO_REFRESH_PAGES).not.toContain('student-activities')
    // Reading pages and the marketing site would just be thrown away.
    expect(PULL_TO_REFRESH_PAGES).not.toContain('activity')
    expect(PULL_TO_REFRESH_PAGES).not.toContain('blog')
    expect(PULL_TO_REFRESH_PAGES).not.toContain('index')
  })

  it('installs nothing before the page it is on is checked', () => {
    const install = pullToRefreshJS.indexOf('createElement')
    const guard = pullToRefreshJS.indexOf('if (!wanted) return;')
    expect(guard).toBeGreaterThan(-1)
    expect(guard).toBeLessThan(install)
  })
})
