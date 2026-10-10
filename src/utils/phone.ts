/**
 * Phone numbers of the `phone` field. The answer is stored as `+<dial code> <number>`, e.g. "+45 20123456":
 * readable in an e-mail and easy to turn into E.164 (remove the space). "Valid" is checked against each country's
 * numbering plan (length and leading digits) with libphonenumber-js, the JavaScript port of Google's libphonenumber.
 */
import { isValidPhoneNumber, parsePhoneNumberFromString } from 'libphonenumber-js/min';
import countries from '../components/re-country-select/countries';

export type PhoneCountry = { name: string; dialCode: string; code: string };

const COUNTRY_LIST = countries as PhoneCountry[];

/** Longest dial codes first, so "+1 868" (Trinidad) wins over "+1". */
const BY_DIAL_LENGTH = [...COUNTRY_LIST].sort((a, b) => b.dialCode.replace(/\D/g, '').length - a.dialCode.replace(/\D/g, '').length);

const digits = (value: any) => String(value === undefined || value === null ? '' : value).replace(/\D/g, '');

export const phoneCountry = (code?: string): PhoneCountry | undefined => (code ? COUNTRY_LIST.find(c => c.code === String(code).toLowerCase()) : undefined);

/**
 * Splits a stored answer into its country and national number. `preferred` breaks ties between countries that share
 * a dial code (+1 is the USA, Canada and others; +7 Russia and Kazakhstan).
 */
export function parsePhone(value: any, preferred?: string): { country?: PhoneCountry; number: string } {
  const text = String(value === undefined || value === null ? '' : value).trim();
  if (!text.startsWith('+')) return { number: digits(text) };
  const all = digits(text);
  const spaced = /^\+(\d+)\s+(.*)$/.exec(text);
  const candidates = BY_DIAL_LENGTH.filter(c => (spaced ? digits(c.dialCode) === spaced[1] : all.startsWith(digits(c.dialCode))));
  const country = candidates.find(c => c.code === preferred) || candidates[0];
  if (!country) return { number: all };
  return { country, number: all.slice(digits(country.dialCode).length) };
}

/** The stored form of a number: "+45 12345678" (an empty number stores nothing). */
export function formatPhone(country: PhoneCountry | undefined, number: string): string {
  // the national trunk 0 ("070 …" in Sweden, "030 …" in Germany) is not dialled after the country code; Italy keeps it
  const keepsZero = country && ['it', 'sm', 'va'].includes(country.code);
  const national = keepsZero ? digits(number) : digits(number).replace(/^0/, '');
  if (!national) return '';
  return country ? `${country.dialCode} ${national}` : national;
}

/** The number in E.164 form ("+4520123456"), or '' when it has no country code. */
const e164 = (value: any) => {
  const text = String(value === undefined || value === null ? '' : value).trim();
  return text.startsWith('+') ? `+${digits(text)}` : '';
};

/** A number that exists in its country's numbering plan (e.g. a Danish number has 8 digits and cannot start with 1). */
export function isValidPhone(value: any): boolean {
  if (value === undefined || value === null || value === '') return true; // empty answers are the job of `required`
  const full = e164(value);
  if (!full) return false;
  try {
    return isValidPhoneNumber(full);
  } catch (e) {
    return false;
  }
}

/** Whether the number belongs to one of `codes` (country codes like "dk", "se"). */
export function phoneFromCountries(value: any, codes: string[]): boolean {
  if (value === undefined || value === null || value === '' || !codes || !codes.length) return true;
  const wanted = codes.map(c => String(c).trim().toLowerCase()).filter(Boolean);
  // the numbering plan tells countries apart even when they share a dial code (+1: USA or Canada)
  try {
    const known = parsePhoneNumberFromString(e164(value));
    if (known && known.country) return wanted.includes(known.country.toLowerCase());
  } catch (e) {
    /* not a number the plan knows: fall back to the dial code */
  }
  const { country } = parsePhone(value, wanted[0]);
  if (!country) return false;
  // countries sharing a dial code (+1) cannot be told apart, so any of them is accepted when one of them is
  const dial = country.dialCode;
  return COUNTRY_LIST.some(c => c.dialCode === dial && wanted.includes(c.code));
}

/** The country to start a phone field with: its own setting, else the region of a language like "da-DK", else the language's usual country. */
const LANGUAGE_COUNTRY: { [language: string]: string } = { da: 'dk', sv: 'se', nb: 'no', nn: 'no', no: 'no', fi: 'fi', en: 'gb', es: 'es', pt: 'pt', de: 'de', fr: 'fr', it: 'it', nl: 'nl', pl: 'pl', ca: 'es', is: 'is', et: 'ee', cs: 'cz', el: 'gr', ja: 'jp', ko: 'kr', zh: 'cn', uk: 'ua', ar: 'sa', he: 'il' };
export function defaultPhoneCountry(configured?: string, languages: readonly string[] = []): string | undefined {
  if (configured && phoneCountry(configured)) return configured.toLowerCase();
  for (const raw of languages) {
    const [language, region] = String(raw || '').toLowerCase().split(/[-_]/);
    if (region && phoneCountry(region)) return region;
    if (LANGUAGE_COUNTRY[language]) return LANGUAGE_COUNTRY[language];
  }
  return undefined;
}

/** "e.g. company.com, other.dk": whether an e-mail address is on one of the domains (subdomains included). */
export function emailInDomains(value: any, domains: string[]): boolean {
  if (value === undefined || value === null || value === '' || !domains || !domains.length) return true;
  const domain = String(value).split('@').pop()!.trim().toLowerCase();
  return domains.some(raw => {
    const d = String(raw).trim().toLowerCase().replace(/^@/, '');
    return d && (domain === d || domain.endsWith(`.${d}`));
  });
}
