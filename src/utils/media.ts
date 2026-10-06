/**
 * Content blocks that show things (image, video, link, icon, embed): turning what people paste into something safe to
 * put in the page.
 */

/** A video link as something the page can play: YouTube, Vimeo and Loom links become their embed player, files a <video>. */
export function videoSource(url?: string): { kind: 'iframe' | 'file'; src: string } | null {
  const value = String(url || '').trim();
  if (!/^https:\/\//i.test(value)) return null;
  let m = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/i.exec(value);
  if (m) {
    const start = /[?&]t=(\d+)/.exec(value);
    // the privacy-enhanced player: no YouTube cookies until the visitor presses play
    return { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${m[1]}${start ? `?start=${start[1]}` : ''}` };
  }
  m = /vimeo\.com\/(?:video\/)?(\d+)/i.exec(value);
  if (m) return { kind: 'iframe', src: `https://player.vimeo.com/video/${m[1]}?dnt=1` };
  m = /loom\.com\/(?:share|embed)\/([\w-]+)/i.exec(value);
  if (m) return { kind: 'iframe', src: `https://www.loom.com/embed/${m[1]}` };
  if (/\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(value)) return { kind: 'file', src: value };
  return null;
}

/** A link people can follow: web pages, e-mail and phone links, or a path on the same site. Never `javascript:`. */
export function safeLinkUrl(url?: string): string | null {
  const value = String(url || '').trim();
  if (!/^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(value)) return null;
  return value;
}

/** A page to show in a frame (a map, a booking calendar, a PDF): https only. */
export function safeEmbedUrl(url?: string): string | null {
  const value = String(url || '').trim();
  return /^https:\/\//i.test(value) ? value : null;
}

/** Icons of the icon block (24×24, stroked). The builder offers the same names. */
export const BLOCK_ICONS: { [name: string]: string } = {
  check: 'M5 13l4 4L19 7',
  checkCircle: 'M12 21a9 9 0 100-18 9 9 0 000 18zM8 12.5l2.5 2.5L16 9.5',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  info: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v5M12 8h.01',
  warning: 'M12 4l9 16H3zM12 10v4M12 17h.01',
  gift: 'M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-1.5-3-5-3-5-1s3 1 5 1zM12 7c1.5-3 5-3 5-1s-3 1-5 1z',
  party: 'M4 20l4-12 8 8zM14 4l1 2M19 5l-2 2M20 10h-2M10 3l.5 2',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2',
  home: 'M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
  location: 'M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 018 0v4',
  key: 'M14 4a6 6 0 11-4.2 10.2L4 20v-3h3v-3h3l-.2-.2A6 6 0 0114 4zM16 8h.01',
  document: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
  camera: 'M4 8h4l2-3h4l2 3h4v11H4zM12 16a3 3 0 100-6 3 3 0 000 6z',
  smile: 'M12 21a9 9 0 100-18 9 9 0 000 18zM8.5 14.5a4.5 4.5 0 007 0M9 9.5h.01M15 9.5h.01',
  thumbsUp: 'M7 11v9H4v-9zM7 11l4-7a2 2 0 012 2v4h5a2 2 0 012 2.3l-1.2 6A2 2 0 0116.8 20H7',
  lightbulb: 'M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z',
  rocket: 'M5 15c-1 1-2 4-2 6 2 0 5-1 6-2M14 4c3-1 6-1 6-1s0 3-1 6l-6 6-5-5zM9 15l-3-3M15 9h.01',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  wrench: 'M14.5 6.5a4 4 0 015.2 5.2l-8.5 8.5a2 2 0 01-2.8-2.8l8.5-8.5a4 4 0 01-2.4-2.4zM17 3l1 3',
};

/** An icon stored in the form as SVG shapes (`[["path", { d: "…" }], ["circle", { cx, cy, r }]]`, the Lucide format). */
export type IconNode = [string, { [attr: string]: string | number }][];

const ICON_TAGS = ['path', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'rect'];
const ICON_ATTRS = ['d', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'points', 'width', 'height'];

/** Only plain shapes with geometry attributes: nothing that can run code or load something. */
export function safeIconNode(node: any): IconNode {
  if (!Array.isArray(node)) return [];
  return node
    .filter(part => Array.isArray(part) && ICON_TAGS.includes(part[0]) && part[1] && typeof part[1] === 'object')
    .slice(0, 40)
    .map(([tag, attrs]) => {
      const clean: { [attr: string]: string } = {};
      ICON_ATTRS.forEach(a => {
        const v = attrs[a];
        if ((typeof v === 'string' || typeof v === 'number') && /^[\d\s.,\-a-zA-Z]*$/.test(String(v)) && String(v).length < 4000) clean[a] = String(v);
      });
      return [tag, clean] as [string, { [attr: string]: string }];
    });
}

/** A colour people picked (#rgb / #rrggbb), or nothing. */
export const safeColor = (value: any) => (typeof value === 'string' && /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(value) ? value : undefined);
