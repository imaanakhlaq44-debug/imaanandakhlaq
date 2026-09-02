// Inserting a tag into a built page, without landing inside somebody's string.
//
// Every APK script did this the same way:
//
//   html.replace('</body>', tag + '</body>')
//
// String.replace takes the FIRST match, and the first '</body>' in a page is
// not always the document's. admin-dashboard.html builds a printable window
// with w.document.write('<html>…</body></html>'), so the first one sits inside
// a JavaScript string literal — and the injected '</script>' inside that literal
// closes the page's real script tag early. The rest of the file then renders as
// visible text: the school dashboard came up as a wall of source code.
//
// The document's own closing tag is the LAST one that is not inside a script,
// which is what these two find.

const SCRIPT_OPEN = /<script\b[^>]*>/gi;
const SCRIPT_CLOSE = '</script>';

/**
 * The spans a browser treats as script, found the way a browser finds them:
 * from an opening tag to the next literal '</script>', quoting rules and all.
 */
function scriptRanges(html) {
  const ranges = [];
  SCRIPT_OPEN.lastIndex = 0;
  let match;
  while ((match = SCRIPT_OPEN.exec(html)) !== null) {
    const bodyStart = match.index + match[0].length;
    const close = html.indexOf(SCRIPT_CLOSE, bodyStart);
    if (close === -1) break;
    ranges.push([match.index, close + SCRIPT_CLOSE.length]);
    SCRIPT_OPEN.lastIndex = close;
  }
  return ranges;
}

function insideAny(ranges, index) {
  return ranges.some(function (range) {
    return index > range[0] && index < range[1];
  });
}

/**
 * Index of the page's own closing tag, or -1 when the page has none. `closing`
 * is '</body>' or '</head>'.
 */
function documentTagIndex(html, closing) {
  const ranges = scriptRanges(html);
  let found = -1;
  let from = 0;
  for (;;) {
    const at = html.indexOf(closing, from);
    if (at === -1) break;
    if (!insideAny(ranges, at)) found = at;
    from = at + closing.length;
  }
  return found;
}

/**
 * Put `snippet` immediately before the page's own </body>. Appends to the end
 * when the page has no body tag outside a script, which is what the callers
 * did before and is right for a fragment.
 */
function insertBeforeBodyEnd(html, snippet) {
  const at = documentTagIndex(html, '</body>');
  if (at === -1) return html + snippet;
  return html.slice(0, at) + snippet + html.slice(at);
}

/** The same for </head>. */
function insertBeforeHeadEnd(html, snippet) {
  const at = documentTagIndex(html, '</head>');
  if (at === -1) return html + snippet;
  return html.slice(0, at) + snippet + html.slice(at);
}

module.exports = {
  insertBeforeBodyEnd,
  insertBeforeHeadEnd,
  documentTagIndex,
  scriptRanges,
};
