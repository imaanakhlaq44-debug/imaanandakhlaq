// Turns a DOCX word/document.xml into plain paragraphs (one per line in
// output), keeping in-paragraph line breaks as "\n" inside the paragraph.
const fs = require('fs');
function decode(s) {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&');
}
function paragraphs(xml) {
  const body = xml.slice(xml.indexOf('<w:body'));
  const out = [];
  const re = /<w:p[ >][\s\S]*?<\/w:p>|<w:p\/>/g;
  let m;
  while ((m = re.exec(body))) {
    const p = m[0];
    let text = '';
    const tok = /<w:t(?: [^>]*)?>([\s\S]*?)<\/w:t>|<w:t\/>|<w:br[^>]*\/>|<w:cr\/>|<w:tab\/>/g;
    let t;
    while ((t = tok.exec(p))) {
      if (t[0].startsWith('<w:br') || t[0] === '<w:cr/>') text += '\n';
      else if (t[0] === '<w:tab/>') text += '\t';
      else if (t[1] !== undefined) text += decode(t[1]);
    }
    if (text.trim()) out.push(text);
  }
  return out;
}
module.exports = { paragraphs };
if (require.main === module) {
  const ps = paragraphs(fs.readFileSync(process.argv[2], 'utf8'));
  for (const p of ps) console.log(JSON.stringify(p));
}
