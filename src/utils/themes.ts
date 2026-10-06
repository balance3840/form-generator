/**
 * Theme handling. A theme is a small JSON object that is turned into CSS custom properties
 * on the form root, so every part of the generator (and of the builder preview) can be restyled.
 */

export type FormTheme = {
  preset?: string;
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  pageBackground?: string;
  fontFamily?: string;
  borderRadius?: number;
  inputStyle?: 'outlined' | 'filled' | 'underlined';
  spacing?: 'compact' | 'comfortable' | 'spacious';
  cardStyle?: 'bordered' | 'shadow' | 'flat';
  maxWidth?: number;
  buttonStyle?: 'solid' | 'outline';
  buttonWidth?: 'full' | 'auto';
  /** Where the submit button sits when it does not fill the width. */
  buttonAlign?: 'left' | 'center' | 'right';
  labelStyle?: 'normal' | 'uppercase';
  /** Branding images: http(s) URLs, relative paths or `data:image/...` URLs. */
  logo?: string;
  logoHeight?: number;
  logoAlign?: 'left' | 'center' | 'right';
  cover?: string;
  coverHeight?: number;
  customCss?: string;
};

export const DEFAULT_THEME: FormTheme = {
  primaryColor: '#4f46e5',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  pageBackground: '#f3f4f6',
  fontFamily: 'system',
  borderRadius: 10,
  inputStyle: 'outlined',
  spacing: 'comfortable',
  cardStyle: 'shadow',
  maxWidth: 640,
  buttonStyle: 'solid',
  buttonWidth: 'full',
  buttonAlign: 'left',
  labelStyle: 'normal',
};

export const THEME_PRESETS: { id: string; name: string; theme: FormTheme }[] = [
  { id: 'indigo', name: 'Indigo', theme: { ...DEFAULT_THEME } },
  {
    id: 'minimal',
    name: 'Minimal',
    theme: { ...DEFAULT_THEME, primaryColor: '#111827', backgroundColor: '#ffffff', pageBackground: '#ffffff', borderRadius: 4, inputStyle: 'underlined', cardStyle: 'flat', spacing: 'spacious', maxWidth: 560 },
  },
  {
    id: 'soft',
    name: 'Soft',
    theme: { ...DEFAULT_THEME, primaryColor: '#ec4899', backgroundColor: '#fff7fb', textColor: '#4a1d3a', pageBackground: '#fde7f3', borderRadius: 20, inputStyle: 'filled', cardStyle: 'shadow', fontFamily: 'Nunito' },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    theme: { ...DEFAULT_THEME, primaryColor: '#0284c7', backgroundColor: '#ffffff', textColor: '#0c2a3d', pageBackground: '#e0f2fe', borderRadius: 8, inputStyle: 'filled', cardStyle: 'shadow' },
  },
  {
    id: 'forest',
    name: 'Forest',
    theme: { ...DEFAULT_THEME, primaryColor: '#15803d', backgroundColor: '#fbfdf9', textColor: '#14301f', pageBackground: '#e7f3e8', borderRadius: 12, inputStyle: 'outlined', cardStyle: 'bordered', fontFamily: 'Merriweather' },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    theme: { ...DEFAULT_THEME, primaryColor: '#ea580c', backgroundColor: '#fffaf5', textColor: '#431407', pageBackground: '#ffedd5', borderRadius: 14, inputStyle: 'outlined', cardStyle: 'shadow', fontFamily: 'Poppins' },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    theme: { ...DEFAULT_THEME, primaryColor: '#8b5cf6', backgroundColor: '#161625', textColor: '#e5e7eb', pageBackground: '#0b0b14', borderRadius: 12, inputStyle: 'filled', cardStyle: 'bordered', fontFamily: 'Inter' },
  },
  {
    id: 'mono',
    name: 'Mono',
    theme: { ...DEFAULT_THEME, primaryColor: '#16a34a', backgroundColor: '#0f1512', textColor: '#d1fae5', pageBackground: '#070a08', borderRadius: 0, inputStyle: 'outlined', cardStyle: 'bordered', buttonStyle: 'outline', labelStyle: 'uppercase', fontFamily: 'JetBrains Mono' },
  },
];

export const FONT_OPTIONS = [
  { value: 'system', label: 'System default' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Nunito', label: 'Nunito' },
  { value: 'DM Sans', label: 'DM Sans' },
  { value: 'Merriweather', label: 'Merriweather (serif)' },
  { value: 'Playfair Display', label: 'Playfair Display (serif)' },
  { value: 'JetBrains Mono', label: 'JetBrains Mono (mono)' },
];

const SYSTEM_STACK = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;

export function resolveTheme(theme: any): FormTheme {
  let input = theme;
  if (typeof input === 'string') {
    try {
      input = JSON.parse(input);
    } catch (e) {
      input = { preset: input };
    }
  }
  input = input || {};
  const preset = THEME_PRESETS.find(p => p.id === input.preset);
  return { ...DEFAULT_THEME, ...(preset ? preset.theme : {}), ...input };
}

/** Black or white, whichever reads better on top of the given hex colour. */
export function contrastColor(hex: string): string {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || '').trim());
  if (!m) return '#ffffff';
  let h = m[1];
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.38 ? '#111827' : '#ffffff';
}

export function fontStack(font?: string): string {
  if (!font || font === 'system') return SYSTEM_STACK;
  const generic = /Merriweather|Playfair/.test(font) ? 'serif' : /Mono/.test(font) ? 'monospace' : 'sans-serif';
  return `'${font}', ${generic}`;
}

export function googleFontUrl(font?: string): string | null {
  if (!font || font === 'system') return null;
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g, '+')}:wght@400;500;600;700&display=swap`;
}

const SPACING = { compact: { gap: '12px', pad: '10px 12px', h: '38px' }, comfortable: { gap: '20px', pad: '12px 14px', h: '44px' }, spacious: { gap: '28px', pad: '15px 16px', h: '52px' } };

export function themeToCssVars(input: any): { [key: string]: string } {
  const t = resolveTheme(input);
  const space = SPACING[t.spacing] || SPACING.comfortable;
  const underlined = t.inputStyle === 'underlined';
  const vars: { [key: string]: string } = {
    '--rfg-primary': t.primaryColor,
    '--rfg-primary-contrast': contrastColor(t.primaryColor),
    '--rfg-bg': t.backgroundColor,
    '--rfg-text': t.textColor,
    '--rfg-page-bg': t.pageBackground,
    '--rfg-font': fontStack(t.fontFamily),
    '--rfg-radius': `${t.borderRadius}px`,
    '--rfg-gap': space.gap,
    '--rfg-input-pad': underlined ? '8px 2px' : space.pad,
    '--rfg-input-height': underlined ? '40px' : space.h,
    '--rfg-max-width': `${t.maxWidth}px`,
    'color-scheme': contrastColor(t.backgroundColor) === '#ffffff' ? 'dark' : 'light',
    '--rfg-label-transform': t.labelStyle === 'uppercase' ? 'uppercase' : 'none',
    '--rfg-label-spacing': t.labelStyle === 'uppercase' ? '0.06em' : '0',
    '--rfg-label-size': t.labelStyle === 'uppercase' ? '12px' : '14px',
  };
  return vars;
}

/**
 * Only plain image sources are accepted for the logo / cover (http(s), relative paths, data:image). Anything else,
 * such as `javascript:` URLs, is ignored. Characters that could break out of a CSS `url("...")` are percent-encoded.
 */
export function safeImageUrl(url?: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const value = url.trim();
  if (!/^(https?:\/\/|data:image\/(png|jpe?g|gif|webp|avif|svg\+xml);base64,|\/|\.{1,2}\/)/i.test(value)) return null;
  return value.replace(/[\\\n\r"]/g, c => encodeURIComponent(c));
}
