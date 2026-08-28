import { defineConfig } from 'vite'
import devServer from '@hono/vite-dev-server'
import ssg from '@hono/vite-ssg'
import { existsSync } from 'node:fs'
import { join, normalize } from 'node:path'

/**
 * Dev only: send /anything.html to /anything so Hono answers it.
 *
 * Vite serves public/ before the dev-server plugin gets a look in, so
 * /admin-dashboard.html was answered straight off disk — skipping the
 * /admin-dashboard route in src/app.ts, which is where that file's Firebase
 * config, pull-to-refresh and emulator connection are substituted in. The
 * page then ran with its hardcoded production project id and no emulator
 * connection: a dashboard you opened to test local changes, quietly reading
 * and writing the live school data.
 *
 * Production is unaffected — the SSG build writes the substituted page over
 * the copied one — which is exactly why this only ever bites locally, and
 * only for the pages that are maintained as static files.
 */
/**
 * Dev only: let public/ files keep their cache-busting query.
 *
 * The dashboards link their stylesheets with a version marker —
 * `dashboard-ui.css?v=1`, `dashboard-buttons.css?v=4` — so a deploy cannot
 * hand a returning school last month's CSS. Vite's static handler answered
 * every one of those with a 404, and only those: the same file without the
 * query was served fine.
 *
 * Losing dashboard-ui.css locally is not a cosmetic diff. It is where the
 * :root design tokens live, so `background: var(--ds-accent)` on the primary
 * buttons resolved to nothing — a white label on a white card, a Confirm
 * Import button you could only find by hovering over it.
 *
 * The query is dropped only when the path is a real file inside public/. That
 * matters: Vite's own module URLs (`/src/app.ts?t=…`, `/node_modules/.vite/
 * deps/x.js?v=…`) carry a query that MUST survive, and none of them exist on
 * disk under public/.
 */
function publicAssetQueries(publicDir: string) {
  return {
    name: 'public-asset-queries',
    configureServer(server: any) {
      const root = normalize(publicDir)
      server.middlewares.use((req: any, _res: any, next: any) => {
        const url = String(req.url || '')
        const q = url.indexOf('?')
        if (q > 0) {
          const path = url.slice(0, q)
          try {
            const file = normalize(join(root, decodeURIComponent(path)))
            if (file.startsWith(root) && existsSync(file)) req.url = path
          } catch (_) { /* a malformed escape is not ours to answer */ }
        }
        next()
      })
    }
  }
}

function htmlToCleanUrls() {
  return {
    name: 'html-to-clean-urls',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const [path, search] = String(req.url || '').split('?')
        if (path.endsWith('.html') && path !== '/index.html') {
          res.statusCode = 302
          res.setHeader('Location', path.slice(0, -'.html'.length) + (search ? '?' + search : ''))
          res.end()
          return
        }
        next()
      })
    }
  }
}

export default defineConfig(({ command }) => {
  if (command === 'build') {
    return {
      plugins: [ssg({ entry: 'src/index.tsx' })]
    }
  }

  return {
    plugins: [
      publicAssetQueries(join(process.cwd(), 'public')),
      htmlToCleanUrls(),
      devServer({
        entry: 'src/index.tsx'
      })
    ]
  }
});
