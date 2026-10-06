// Builds the v2 documentation pages (website/docs) from ../readme.md: one page per "##" section, and one per "###" inside
// "Document reference". Run `npm run split` after editing the readme. Do not edit website/docs by hand.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';

const src = readFileSync('../readme.md', 'utf8').split('\n');
const OUT = 'docs';
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const ghSlug = t => t.toLowerCase().replace(/<[^>]+>/g, '').replace(/[`*]/g, '').replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-');
const fileSlug = t => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// 1. cut into blocks at "## " and (inside Document reference) "### "
const blocks = [];
let cur = { level: 1, title: 'Form generator', lines: [], parent: null };
let inFence = false, parent = null;
for (const line of src) {
  if (/^```/.test(line)) inFence = !inFence;
  const m = !inFence && line.match(/^(#{1,3}) (.*)$/);
  if (m && m[1].length === 1) { cur.title = 'Introduction'; continue; }
  if (m && (m[1].length === 2 || (m[1].length === 3 && parent === 'Document reference'))) {
    blocks.push(cur);
    const level = m[1].length;
    if (level === 2) parent = m[2];
    cur = { level, title: m[2].trim(), lines: [], parent: level === 3 ? parent : null };
    continue;
  }
  cur.lines.push(line);
}
blocks.push(cur);

// 2. paths and anchors
let pos = 0;
for (const b of blocks) {
  b.pos = ++pos;
  const dir = b.parent ? 'document-reference/' : '';
  b.id = b.title === 'Introduction' ? 'index' : dir + fileSlug(b.title);
}
const refParent = blocks.find(b => b.title === 'Document reference');
const anchors = new Map();
for (const b of blocks) {
  anchors.set(ghSlug(b.title), b.id === 'index' ? '/' : '/' + b.id);
  // headings deeper than the split level stay inside the page
  let fence = false;
  for (const l of b.lines) {
    if (/^```/.test(l)) fence = !fence;
    const m = !fence && l.match(/^#{3,4} (.*)$/);
    if (m) anchors.set(ghSlug(m[1]), '/' + b.id + '#' + ghSlug(m[1]));
  }
}

// 3. MDX-safe text
function mdx(lines, ownId) {
  let fence = false;
  return lines.map(l => {
    if (/^```/.test(l)) { fence = !fence; return l; }
    if (fence) return l;
    const parts = l.split(/(`[^`]*`)/g).map((p, i) => {
      if (i % 2) return p;                          // inline code stays
      return p.replace(/\{/g, '\\{').replace(/\}/g, '\\}').replace(/<(?![/a-zA-Z!])/g, '&lt;')
        .replace(/<(?!\/?(?:a|b|i|em|strong|code|br|kbd|sub|sup)\b)/g, '&lt;')
        .replace(/\]\(#([^)]+)\)/g, (_m, a) => {     // links to a heading of the readme
          const t = anchors.get(a);
          return t ? `](${t === '/' ? '/' : t})` : `](#${a})`;
        })
        .replace(/\]\((\.\.?\/[^)]*|LICENSE)\)/g, (_m, p) => `](https://github.com/balance3840/form-generator/blob/main/${p.replace(/^\.\//, '')})`);
    });
    return parts.join('');
  }).join('\n');
}

// 4. write
const cats = new Set();
for (const b of blocks) {
  const body = mdx(b.lines, b.id).replace(/^\n+/, '').replace(/\s+$/, '');
  if (b === refParent && !body.trim()) { /* nothing */ }
  let file = b.id + '.md', fm = `title: ${JSON.stringify(b.title)}\nsidebar_position: ${b.pos}\n`;
  if (b.id === 'index') fm += 'slug: /\n';
  if (b === refParent) { file = 'document-reference/index.md'; b.id = 'document-reference'; fm += 'slug: /document-reference\n'; }
  if (b.parent && !cats.has('d')) {
    cats.add('d');
    mkdirSync(OUT + '/document-reference', { recursive: true });
    writeFileSync(OUT + '/document-reference/_category_.json', JSON.stringify({ label: 'Document reference', position: refParent.pos, link: { type: 'doc', id: 'document-reference/index' } }, null, 2));
  }
  if (b.parent) { fm = fm.replace(/sidebar_position: \d+/, `sidebar_position: ${b.pos}`); }
  mkdirSync(OUT + '/' + file.split('/').slice(0, -1).join('/'), { recursive: true });
  writeFileSync(`${OUT}/${file}`, `---\n${fm}---\n\n${body}\n`);
}
console.log(blocks.length, 'pages');
