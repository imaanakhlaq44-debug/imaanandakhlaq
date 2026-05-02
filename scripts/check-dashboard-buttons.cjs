const fs = require('fs');
const path = require('path');
const http = require('http');
const puppeteer = require('puppeteer');

const distDir = path.join(__dirname, '..', 'dist');
const routes = [
  '/student-activities.html',
  '/parent-dashboard.html',
  '/teacher-dashboard.html',
  '/admin-dashboard.html'
];

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.pdf': 'application/pdf'
};

function safeResolve(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split('?')[0]);
  const normalized = path.normalize(cleanPath).replace(/^([.][.][/\\])+/, '');
  return path.join(distDir, normalized);
}

function resolveFile(urlPath) {
  let filePath = safeResolve(urlPath);

  if (urlPath === '/' || urlPath === '') {
    filePath = path.join(distDir, 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    const indexPath = path.join(filePath, 'index.html');
    if (fs.existsSync(indexPath)) return indexPath;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return filePath;

  if (!path.extname(filePath)) {
    const htmlPath = `${filePath}.html`;
    if (fs.existsSync(htmlPath) && fs.statSync(htmlPath).isFile()) return htmlPath;

    const jsonPath = `${filePath}.json`;
    if (fs.existsSync(jsonPath) && fs.statSync(jsonPath).isFile()) return jsonPath;
  }

  return null;
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const reqPath = new URL(req.url, 'http://localhost').pathname;
      const filePath = resolveFile(reqPath);

      if (!filePath) {
        res.statusCode = 404;
        res.end('Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
      fs.createReadStream(filePath).pipe(res);
    });

    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, port: addr.port });
    });
  });
}

async function collectControls(page) {
  return page.evaluate(() => {
    const selector = 'button, [onclick], .sidebar-nav li, [data-section], .action-btn, .hub-nav-btn';

    function isVisible(el) {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }

    function cssPath(el) {
      if (el.id) return `#${CSS.escape(el.id)}`;
      const parts = [];
      let cur = el;
      while (cur && cur.nodeType === 1 && cur.tagName.toLowerCase() !== 'html') {
        let part = cur.tagName.toLowerCase();
        const classes = Array.from(cur.classList || [])
          .filter((c) => !/^(active|show|open|selected|collapsed)$/.test(c))
          .slice(0, 2);
        if (classes.length) {
          part += `.${classes.map((c) => CSS.escape(c)).join('.')}`;
        }

        if (cur.parentElement) {
          const sameTag = Array.from(cur.parentElement.children).filter((n) => n.tagName === cur.tagName);
          if (sameTag.length > 1) {
            part += `:nth-of-type(${sameTag.indexOf(cur) + 1})`;
          }
        }

        parts.unshift(part);
        cur = cur.parentElement;
        if (parts.length >= 7) break;
      }
      return parts.join(' > ');
    }

    const rows = [];
    const seen = new Set();

    Array.from(document.querySelectorAll(selector)).forEach((el) => {
      if (!isVisible(el)) return;
      const key = cssPath(el);
      if (!key || seen.has(key)) return;
      seen.add(key);

      const text = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120);
      rows.push({
        selector: key,
        tag: el.tagName.toLowerCase(),
        text,
        id: el.id || '',
        classes: Array.from(el.classList || []).slice(0, 3).join('.'),
        onclick: el.getAttribute('onclick') || ''
      });
    });

    return rows;
  });
}

async function testControl(page, url, control) {
  const consoleErrors = [];
  const pageErrors = [];
  const dialogs = [];

  page.removeAllListeners('console');
  page.removeAllListeners('pageerror');
  page.removeAllListeners('dialog');

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.message || String(err));
  });

  page.on('dialog', async (dialog) => {
    dialogs.push(dialog.message());
    try {
      await dialog.accept();
    } catch (_) {
      // ignore
    }
  });

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

  await page.evaluate(() => {
    window.__clickErrors = [];
    window.addEventListener('error', (e) => {
      window.__clickErrors.push(e.message || 'window error');
    });
    window.addEventListener('unhandledrejection', (e) => {
      window.__clickErrors.push(String(e.reason || 'unhandled rejection'));
    });

    document.addEventListener(
      'click',
      (e) => {
        const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        if (a) e.preventDefault();
      },
      true
    );
  });

  const exists = await page.$(control.selector);
  if (!exists) {
    return {
      status: 'fail',
      reason: 'selector_not_found',
      details: ''
    };
  }

  try {
    await page.$eval(control.selector, (el) => {
      el.scrollIntoView({ block: 'center', inline: 'center' });
    });
  } catch (_) {
    // ignore
  }

  try {
    await page.click(control.selector, { delay: 15 });
  } catch (e) {
    return {
      status: 'fail',
      reason: 'click_exception',
      details: String(e.message || e)
    };
  }

  await new Promise(r => setTimeout(r, 450));

  const runtimeErrors = await page.evaluate(() => (window.__clickErrors || []).slice());
  const allErrors = [...runtimeErrors, ...pageErrors, ...consoleErrors];

  if (allErrors.length > 0) {
    const msg = allErrors[0] || 'unknown_error';
    return {
      status: 'fail',
      reason: 'runtime_error',
      details: msg
    };
  }

  return {
    status: 'pass',
    reason: dialogs.length ? 'dialog_handled' : 'ok',
    details: dialogs.length ? dialogs[0] : ''
  };
}

(async () => {
  const { server, port } = await startServer();
  const browser = await puppeteer.launch({ headless: 'new' });

  const finalReport = {
    baseUrl: `http://127.0.0.1:${port}`,
    dashboards: [],
    failingControls: []
  };

  try {
    for (const route of routes) {
      const page = await browser.newPage();
      const url = `http://127.0.0.1:${port}${route}`;
      let controls = [];
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
        controls = await collectControls(page);
      } catch (e) {
        finalReport.dashboards.push({
          route,
          status: 'load_fail',
          error: String(e.message || e),
          totalControls: 0,
          passed: 0,
          failed: 0
        });
        await page.close();
        continue;
      }

      let passed = 0;
      let failed = 0;
      const failures = [];

      for (const control of controls) {
        const result = await testControl(page, url, control);
        if (result.status === 'pass') {
          passed += 1;
        } else {
          failed += 1;
          const failure = {
            route,
            selector: control.selector,
            text: control.text,
            tag: control.tag,
            onclick: control.onclick,
            reason: result.reason,
            details: result.details
          };
          failures.push(failure);
          finalReport.failingControls.push(failure);
        }
      }

      finalReport.dashboards.push({
        route,
        status: 'ok',
        totalControls: controls.length,
        passed,
        failed,
        failures
      });

      await page.close();
    }

    console.log(JSON.stringify(finalReport, null, 2));
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((err) => {
  console.error('CHECK_FAILED:', err);
  process.exit(1);
});
