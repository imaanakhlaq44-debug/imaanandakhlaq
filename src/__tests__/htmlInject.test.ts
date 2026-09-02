import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

// @ts-expect-error — a plain CommonJS build script, no types to import
import { insertBeforeBodyEnd, insertBeforeHeadEnd, documentTagIndex } from '../../scripts/lib/html-inject.cjs'

/**
 * The school dashboard once came up as a wall of visible source code.
 *
 * admin-dashboard.html builds a printable window with
 * w.document.write('<html>…</body></html>'), so the FIRST '</body>' in the file
 * sits inside a JavaScript string. Every APK script injected its tag with
 * html.replace('</body>', …), which takes the first match — and the injected
 * '</script>' inside that string literal closed the page's real script tag.
 * Everything after it rendered as text.
 */
const PAGE_WITH_A_BODY_TAG_IN_A_STRING = [
  '<html><head><title>t</title></head>',
  '<body>',
  '<div id="app"></div>',
  '<script>',
  "  window.print = () => {",
  "    w.document.write('<html><body>' + slips + '</body></html>');",
  '  };',
  '</script>',
  '</body></html>',
].join('\n')

describe('html-inject', () => {
  it('inserts before the document body, not one inside a script string', () => {
    const out = insertBeforeBodyEnd(PAGE_WITH_A_BODY_TAG_IN_A_STRING, '<script src="gate.js"></script>')

    // The tag lands after the page's own script block, not inside it.
    expect(out.indexOf('gate.js')).toBeGreaterThan(out.indexOf('</script>\n</body>') - 1)
    expect(out).toContain("w.document.write('<html><body>' + slips + '</body></html>');")

    // And the page still closes exactly once, in the right order.
    const bodyEnd = out.lastIndexOf('</body>')
    expect(out.indexOf('gate.js')).toBeLessThan(bodyEnd)
  })

  it('leaves the string literal untouched', () => {
    const out = insertBeforeBodyEnd(PAGE_WITH_A_BODY_TAG_IN_A_STRING, '<!-- x -->')
    const insideString = out.match(/w\.document\.write\('([^']*)'/)
    expect(insideString?.[1]).toBe('<html><body>')
  })

  it('appends when the page has no body tag of its own', () => {
    expect(insertBeforeBodyEnd('<div>fragment</div>', '<!-- x -->')).toBe('<div>fragment</div><!-- x -->')
  })

  it('does the same for head', () => {
    const page = '<html><head></head><body><script>var s = "</head>";</script></body></html>'
    const out = insertBeforeHeadEnd(page, '<link>')
    expect(out.indexOf('<link>')).toBeLessThan(out.indexOf('<body>'))
  })

  it('reports -1 when there is no tag outside a script', () => {
    expect(documentTagIndex('<script>var s = "</body>";</script>', '</body>')).toBe(-1)
  })
})

/**
 * The helper only helps where it is used. Every naive replace was the same bug
 * waiting for a page whose first '</body>' was not the document's.
 */
describe('the APK build scripts', () => {
  const scriptsDir = join(__dirname, '..', '..', 'scripts')

  it('never injects with a bare replace on a closing tag', () => {
    const offenders: string[] = []

    for (const name of readdirSync(scriptsDir).filter((f) => f.endsWith('.cjs'))) {
      const source = readFileSync(join(scriptsDir, name), 'utf8')
      source.split('\n').forEach((line, i) => {
        if (/\.replace\(\s*['"`]<\/(body|head)>/.test(line)) {
          offenders.push(`${name}:${i + 1}  ${line.trim()}`)
        }
      })
    }

    expect(offenders).toEqual([])
  })
})
