const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const babel = require('@babel/core');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const DIST_DIR = path.join(__dirname, '..', 'dist');

// We will transpile both public and dist, but let's focus on public so the source is fixed.
// Actually, modifying public/ means the source code is changed to ES5.

const babelOptions = {
  presets: [
    ['@babel/preset-env', {
      targets: { android: '51', chrome: '51' },
      useBuiltIns: false, // We'll just rely on what works, or inject regenerator
      modules: false
    }]
  ],
  compact: false
};

function transpileHtml(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(html, { decodeEntities: false });

  let modified = false;

  $('script').each((i, el) => {
    const src = $(el).attr('src');
    const type = $(el).attr('type');
    
    // We only transpile inline scripts without type="module" (or change module to normal)
    if (!src && (!type || type === 'text/javascript' || type === 'module')) {
      const code = $(el).html();
      if (code && code.trim()) {
        try {
          const result = babel.transformSync(code, babelOptions);
          if (result && result.code) {
            $(el).html('\n' + result.code + '\n');
            // Remove type="module" since older browsers don't execute it
            if (type === 'module') {
              $(el).removeAttr('type');
            }
            modified = true;
          }
        } catch (e) {
          console.error(`Error transpiling inline script in ${filePath}:`, e.message);
        }
      }
    }
  });

  if (modified) {
    // Inject regenerator-runtime if it has async/await (or just always inject it to be safe)
    if (html.includes('async') || html.includes('await') || $.html().includes('regeneratorRuntime')) {
      if ($('head').length > 0 && !$.html().includes('regenerator-runtime.min.js')) {
        $('head').prepend('<script src="/kidba_assets/js/regenerator-runtime.min.js"></script>\n');
      }
    }
    fs.writeFileSync(filePath, $.html());
    console.log(`Transpiled inline scripts in: ${filePath}`);
  }
}

function transpileJs(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  try {
    const result = babel.transformSync(code, babelOptions);
    if (result && result.code) {
      fs.writeFileSync(filePath, result.code);
      console.log(`Transpiled JS file: ${filePath}`);
    }
  } catch (e) {
    console.error(`Error transpiling ${filePath}:`, e.message);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.html')) {
      transpileHtml(fullPath);
    } else if (file.endsWith('.js') && !file.includes('.min.js')) {
      transpileJs(fullPath);
    }
  }
}

console.log('Starting transpilation of public/ directory...');
processDirectory(PUBLIC_DIR);
console.log('Transpilation complete.');
