import { describe, it, expect } from 'vitest'
import { app } from '../app'

/**
 * The chapter reader's page turns.
 *
 * StPageFlip used to decide these itself, and it was wrong twice over: a
 * fingertip resting on the page turned it, and a pinch — four touch events —
 * flipped three or four pages while the child was only trying to zoom. Its
 * touch handling is now off (useMouseEvents: false) and iaSwipeVerdict() is
 * the whole of the judgement instead.
 *
 * That code only ever runs inside a phone's WebView, so it is lifted out of
 * the page the route actually renders rather than copied here — this cannot
 * pass while the app does something else.
 */
const page: string = await (async () => {
  const res = await app.request('/activity')
  expect(res.status, '/activity did not render').toBe(200)
  return res.text()
})()

const verdict: (g: Record<string, unknown>) => string = (() => {
  const fn = page.match(/function iaSwipeVerdict\(g\) \{[\s\S]*?\n        \}/)
  if (!fn) throw new Error('iaSwipeVerdict not found on the activity page')
  const consts = page.match(/const SWIPE_MIN_DISTANCE = \d+;\n\s*const SWIPE_MAX_DURATION = \d+;/)
  if (!consts) throw new Error('swipe constants not found on the activity page')
  // eslint-disable-next-line no-new-func
  return new Function(consts[0] + '\n' + fn[0] + '\nreturn iaSwipeVerdict;')() as any
})()

/** A gesture that would turn to the next page, which each case then spoils. */
function swipe(overrides: Record<string, unknown> = {}) {
  return { dx: -120, dy: 10, took: 220, zoom: 1, spoiled: false, ...overrides }
}

describe('Chapter reader — what turns a page', () => {
  it('turns forward on a swipe to the left and back on a swipe to the right', () => {
    expect(verdict(swipe())).toBe('next')
    expect(verdict(swipe({ dx: 120 }))).toBe('prev')
  })

  it('does nothing for a touch that goes nowhere', () => {
    // The complaint that started this: the page flipped on the lightest touch.
    expect(verdict(swipe({ dx: 0, dy: 0 }))).toBe('none')
    expect(verdict(swipe({ dx: -6 }))).toBe('none')
    expect(verdict(swipe({ dx: -40 }))).toBe('none')
  })

  it('never turns a page while the reader is zoomed in', () => {
    // Panning around a zoomed page travels a long way sideways.
    expect(verdict(swipe({ zoom: 2, dx: -300 }))).toBe('none')
  })

  it('never turns a page for a gesture a second finger joined', () => {
    // A pinch: this is what flipped three or four pages at once.
    expect(verdict(swipe({ spoiled: true }))).toBe('none')
  })

  it('ignores a mostly up-and-down drag', () => {
    expect(verdict(swipe({ dx: -80, dy: -140 }))).toBe('none')
  })

  it('ignores a slow drag, which is not a swipe', () => {
    expect(verdict(swipe({ took: 2000 }))).toBe('none')
  })

  it('asks for a deliberate distance, not a fingertip wobble', () => {
    const min = Number(page.match(/const SWIPE_MIN_DISTANCE = (\d+);/)![1])
    expect(min).toBeGreaterThanOrEqual(50)
    expect(min).toBeLessThanOrEqual(120)
  })
})

describe('Chapter reader — the flip library is not left in charge', () => {
  it('turns off its own mouse and touch handling', () => {
    expect(page).toMatch(/useMouseEvents:\s*false/)
  })

  it('does not reach for disableFlipByClick, which would break the nav buttons', () => {
    // That option refuses flipNext()/flipPrev() in portrait mode as well —
    // checked against the library in a browser — so turning it on would stop
    // the arrows and the swipe from working at all. With useMouseEvents off
    // the library never sees a click, so there is nothing left for it to do.
    expect(page).not.toMatch(/disableFlipByClick:\s*true/)
  })
})
