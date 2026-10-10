/**
 * Days for the calendar fields (`dates`: several days, `dateRange`: from–to). Days are plain "YYYY-MM-DD" strings in
 * the visitor's own calendar (no time zone), which is what a person means by "Tuesday the 14th".
 */

export const isoOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const dateOf = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const addDays = (iso: string, days: number) => {
  const d = dateOf(iso);
  d.setDate(d.getDate() + days);
  return isoOf(d);
};

export const today = () => isoOf(new Date());

/**
 * A limit people set in the builder: "today", a number of days from today (`"+60"`), or a date. Empty: no limit.
 */
export function resolveDay(value: any): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === 'today') return today();
  const rel = /^([+-]\d+)$/.exec(String(value));
  if (rel) return addDays(today(), Number(rel[1]));
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? String(value) : undefined;
}

/** The weekday a week starts on in a language (0 Sunday … 6 Saturday): Monday in most of Europe, Sunday in the US. */
export function firstDayOfWeek(language: string): number {
  try {
    const locale: any = new (Intl as any).Locale(language && language.includes('-') ? language : language === 'en' ? 'en-GB' : language || 'en-GB');
    const info = typeof locale.getWeekInfo === 'function' ? locale.getWeekInfo() : locale.weekInfo;
    if (info && info.firstDay) return info.firstDay % 7;
  } catch (e) {
    /* older browsers: below */
  }
  return /^en-(US|CA)|^pt-BR|^ja|^he/i.test(language) ? 0 : 1;
}

/** The weeks of a month as rows of days ("" for the days of the previous / next month). */
export function monthGrid(year: number, month: number, firstDay: number): string[][] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() - firstDay + 7) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells: string[] = Array(offset).fill('');
  for (let d = 1; d <= days; d++) cells.push(isoOf(new Date(year, month, d)));
  while (cells.length % 7) cells.push('');
  const weeks: string[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** Short weekday names in the language, starting on `firstDay`. */
export function weekdayNames(language: string, firstDay: number): string[] {
  const names: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(2024, 0, 7 + ((firstDay + i) % 7)); // 7 Jan 2024 was a Sunday
    try {
      names.push(d.toLocaleDateString(language, { weekday: 'short' }).replace('.', ''));
    } catch (e) {
      names.push(['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d.getDay()]);
    }
  }
  return names;
}

/** "October 2026" in the language. */
export function monthTitle(language: string, year: number, month: number): string {
  try {
    const text = new Date(year, month, 1).toLocaleDateString(language, { month: 'long', year: 'numeric' });
    return text.charAt(0).toLocaleUpperCase(language) + text.slice(1);
  } catch (e) {
    return `${year}-${month + 1}`;
  }
}

/** "Tue 14 Oct" in the language (short enough for chips). */
export function dayLabel(language: string, iso: string, long = false): string {
  try {
    return dateOf(iso).toLocaleDateString(language, long ? { weekday: 'long', day: 'numeric', month: 'long' } : { weekday: 'short', day: 'numeric', month: 'short' });
  } catch (e) {
    return iso;
  }
}
