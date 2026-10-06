// One-off: turns the old v1 documentation page (docs/index.html) into Markdown pages, one per top-level section.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import TurndownService from 'turndown';

const out = process.argv[2];
const dom = new JSDOM(readFileSync('../docs/index.html', 'utf8'));
const doc = dom.window.document;
mkdirSync(out, { recursive: true });

const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
td.addRule('pre', {
  filter: 'pre',
  replacement(_c, node) {
    const code = node.textContent.replace(/\n[ \t]*\n/g, '\n').replace(/^\n+|\s+$/g, '');
    const lang = (node.querySelector('code')?.className.match(/\b(html|json|js|javascript|css|bash|typescript)\b/) || [])[1] || '';
    return `\n\n\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
  },
});
td.addRule('code', { filter: n => n.nodeName === 'CODE' && n.parentNode.nodeName !== 'PRE', replacement: (c) => (c.includes('`') ? c : '`' + c.replace(/[{}<]/g, m => '\\' + m).replace(/\\/g, '') + '`') });

doc.querySelectorAll('pre br').forEach(b => b.replaceWith(doc.createTextNode('\n')));
const sections = [...doc.querySelectorAll('section[id]')].filter(s => !s.parentElement.closest('section'));
const slug = t => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
let n = 0;
for (const s of sections) {
  const h = s.querySelector('h1,h2');
  const title = (h?.textContent || s.id).trim();
  h?.remove();
  s.querySelectorAll('[class*="toc"], script, style').forEach(e => e.remove());
  let md = td.turndown(s.innerHTML)
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/\{/g, '\\{').replace(/\}/g, '\\}')   // MDX: braces outside code
    ;
  // undo the escaping inside fenced code
  md = md.replace(/```[\s\S]*?```/g, m => m.replace(/\\\{/g, '{').replace(/\\\}/g, '}'));
  md = md.replace(/<(?![/a-zA-Z!])/g, '&lt;');
  const name = slug(title) || s.id;
  writeFileSync(`${out}/${String(++n).padStart(2, '0')}-${name}.md`, `---\ntitle: ${JSON.stringify(title)}\nsidebar_position: ${n}\n---\n\n${md}\n`);
}
console.log(n, 'pages');
