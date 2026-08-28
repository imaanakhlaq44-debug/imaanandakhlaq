import { defineConfig } from 'vite'
import devServer from '@hono/vite-dev-server'
import ssg from '@hono/vite-ssg'

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
      htmlToCleanUrls(),
      devServer({
        entry: 'src/index.tsx'
      })
    ]
  }
});
