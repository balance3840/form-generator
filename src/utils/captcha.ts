/**
 * Spam protection providers. A widget provider shows a challenge and hands the form a token; the token is sent with the
 * answers (under the provider's usual field name) and YOUR SERVER must verify it with the provider's SECRET key.
 * The site key used here is public by design; never put a secret key in a form.
 */
export type CaptchaProviderInfo = {
  id: string;
  label: string;
  description: string;
  /** Needs a (public) site key. */
  needsKey: boolean;
  /** Shows a widget (or runs invisibly) and produces a token. */
  token: boolean;
  /** Name of the token in the submitted answers, as the provider's server-side docs expect it. */
  field: string;
  keyUrl?: string;
  /** A key the provider publishes for testing: it always passes (never use it in production). */
  testKey?: string;
  verifyUrl?: string;
};

export const CAPTCHA_PROVIDERS: CaptchaProviderInfo[] = [
  { id: 'none', label: 'None', description: 'No spam protection.', needsKey: false, token: false, field: '' },
  { id: 'honeypot', label: 'Basic (no account)', description: 'A hidden trap field that humans never see. Stops simple bots, nothing to sign up for or verify.', needsKey: false, token: false, field: '' },
  { id: 'turnstile', label: 'Cloudflare Turnstile', description: 'Privacy friendly and usually invisible. Free.', needsKey: true, token: true, field: 'cf-turnstile-response', keyUrl: 'https://developers.cloudflare.com/turnstile/get-started/', testKey: '1x00000000000000000000AA', verifyUrl: 'https://challenges.cloudflare.com/turnstile/v0/siteverify' },
  { id: 'hcaptcha', label: 'hCaptcha', description: 'Privacy friendly image challenge. Free tier.', needsKey: true, token: true, field: 'h-captcha-response', keyUrl: 'https://dashboard.hcaptcha.com/signup', testKey: '10000000-ffff-ffff-ffff-000000000001', verifyUrl: 'https://api.hcaptcha.com/siteverify' },
  { id: 'recaptcha', label: 'Google reCAPTCHA v2 (checkbox)', description: 'The classic "I am not a robot" box.', needsKey: true, token: true, field: 'g-recaptcha-response', keyUrl: 'https://www.google.com/recaptcha/admin/create', testKey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI', verifyUrl: 'https://www.google.com/recaptcha/api/siteverify' },
  { id: 'recaptcha3', label: 'Google reCAPTCHA v3 (invisible)', description: 'No challenge: scores the visitor in the background (shows Google’s small badge).', needsKey: true, token: true, field: 'g-recaptcha-response', keyUrl: 'https://www.google.com/recaptcha/admin/create', verifyUrl: 'https://www.google.com/recaptcha/api/siteverify' },
];

export type CaptchaConfig = { provider: string; siteKey?: string; theme?: 'auto' | 'light' | 'dark' };

export const captchaProvider = (id?: string) => CAPTCHA_PROVIDERS.find(p => p.id === id);

/** The captcha settings of a form: `settings.captcha`, or the old `action.recaptchaSiteKey`. */
export function captchaConfig(settings: { [key: string]: any } | undefined, action: { [key: string]: any } | undefined): CaptchaConfig | null {
  const own = settings && settings.captcha;
  if (own && own.provider && own.provider !== 'none') return own;
  if (action && action.recaptchaSiteKey) return { provider: 'recaptcha', siteKey: action.recaptchaSiteKey };
  return null;
}

/** Providers that need a widget container in the page (reCAPTCHA v3 runs without one). */
export const hasWidget = (provider: string) => ['turnstile', 'hcaptcha', 'recaptcha'].includes(provider);

export type CaptchaController = {
  /** The current token ('' until the challenge is solved). reCAPTCHA v3 asks Google for a fresh one. */
  token: () => Promise<string>;
  reset: () => void;
  destroy: () => void;
};

const scripts: { [src: string]: Promise<void> } = {};
function loadScript(src: string): Promise<void> {
  if (!scripts[src]) {
    scripts[src] = new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = src;
      el.async = true;
      el.defer = true;
      el.onload = () => resolve();
      el.onerror = () => {
        delete scripts[src];
        reject(new Error(`Could not load ${src}`));
      };
      document.head.appendChild(el);
    });
  }
  return scripts[src];
}

const ready = (check: () => any, timeout = 8000) =>
  new Promise<void>((resolve, reject) => {
    const started = Date.now();
    const tick = () => (check() ? resolve() : Date.now() - started > timeout ? reject(new Error('captcha script did not start')) : setTimeout(tick, 50));
    tick();
  });

/** Shows the provider's widget in `container` and reports tokens through `onToken` ('' when it expires or fails). */
export async function mountCaptcha(config: CaptchaConfig, container: HTMLElement, options: { language?: string; theme: 'light' | 'dark'; onToken: (token: string) => void }): Promise<CaptchaController> {
  const w = window as any;
  const { siteKey = '' } = config;
  const lang = (options.language || 'en').split('-')[0];
  const onToken = options.onToken;

  if (config.provider === 'turnstile') {
    await loadScript('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit');
    await ready(() => w.turnstile);
    const id = w.turnstile.render(container, { sitekey: siteKey, theme: options.theme, language: lang, callback: (t: string) => onToken(t), 'expired-callback': () => onToken(''), 'error-callback': () => onToken('') });
    return { token: async () => w.turnstile.getResponse(id) || '', reset: () => (w.turnstile.reset(id), onToken('')), destroy: () => w.turnstile.remove(id) };
  }

  if (config.provider === 'hcaptcha') {
    await loadScript(`https://js.hcaptcha.com/1/api.js?render=explicit&hl=${encodeURIComponent(lang)}`);
    await ready(() => w.hcaptcha);
    const id = w.hcaptcha.render(container, { sitekey: siteKey, theme: options.theme, callback: (t: string) => onToken(t), 'expired-callback': () => onToken(''), 'error-callback': () => onToken('') });
    return { token: async () => w.hcaptcha.getResponse(id) || '', reset: () => (w.hcaptcha.reset(id), onToken('')), destroy: () => w.hcaptcha.remove(id) };
  }

  if (config.provider === 'recaptcha') {
    await loadScript(`https://www.google.com/recaptcha/api.js?render=explicit&hl=${encodeURIComponent(lang)}`);
    await ready(() => w.grecaptcha && w.grecaptcha.render);
    const id = w.grecaptcha.render(container, { sitekey: siteKey, theme: options.theme, callback: (t: string) => onToken(t), 'expired-callback': () => onToken('') });
    return { token: async () => w.grecaptcha.getResponse(id) || '', reset: () => (w.grecaptcha.reset(id), onToken('')), destroy: () => (container.innerHTML = '') };
  }

  if (config.provider === 'recaptcha3') {
    await loadScript(`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`);
    await ready(() => w.grecaptcha && w.grecaptcha.execute);
    return {
      token: () => new Promise<string>(resolve => w.grecaptcha.ready(() => w.grecaptcha.execute(siteKey, { action: 'submit' }).then(resolve, () => resolve('')))),
      reset: () => onToken(''),
      destroy: () => undefined,
    };
  }

  throw new Error(`Unknown captcha provider "${config.provider}"`);
}
