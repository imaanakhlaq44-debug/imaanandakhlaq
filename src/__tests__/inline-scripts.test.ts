import { describe, it, expect } from 'vitest'
import esbuild from 'esbuild'
import { app } from '../app'

/**
 * Every page in this app ships its Firebase logic as an inline
 * <script type="module"> built inside a hono template literal. tsc typechecks
 * the .tsx around that literal and never looks inside it, so a syntax error
 * in the biggest and most-edited code in the repo compiles clean, ships, and
 * only surfaces as a blank page in a browser.
 *
 * These tests parse what each route actually renders.
 */

const ROUTES = [
  '/activity',
  '/student-activities',
  '/teacher-dashboard',
  '/auth',
  '/family',
  // Served straight off disk from public/, so nothing else in the build
  // typechecks or parses it at all.
  '/admin-dashboard'
]

async function moduleScriptsFor(route: string): Promise<string[]> {
  const res = await app.request(route)
  expect(res.status, `${route} did not render`).toBe(200)
  const body = await res.text()
  return [...body.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)].map((m) => m[1])
}

describe('Inline module scripts', () => {
  for (const route of ROUTES) {
    it(`parses every module script on ${route}`, async () => {
      const scripts = await moduleScriptsFor(route)
      expect(scripts.length, `${route} rendered no module script`).toBeGreaterThan(0)

      for (const [i, source] of scripts.entries()) {
        await expect(
          esbuild.transform(source, { loader: 'js', format: 'esm' }),
          `${route} module script #${i} failed to parse`
        ).resolves.toBeTruthy()
      }
    })
  }

  // The learner and the signed-in account are about to stop being the same
  // thing. On a family login, auth.currentUser.uid is the parent — it owns no
  // submissions, and using it as a student id would write one child's homework
  // onto another's sheet. The activity page must resolve the learner through
  // activeChild.ts instead.
  it('resolves the learner through activeChild on the activity page', async () => {
    const [script] = await moduleScriptsFor('/activity')
    expect(script).toContain('acResolveIdentity')
    expect(script).toContain('acOwnership')
  })
})
