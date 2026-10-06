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

/* ---------------------------------------------------- months, weeks, years */

/** The ISO week of a day (weeks start on Monday; week 1 holds the first Thursday of the year): `2026-W42`. */
export function weekOf(iso: string): string {
  const d = dateOf(iso);
  const day = (d.getDay() + 6) % 7; // Monday 0 … Sunday 6
  d.setDate(d.getDate() - day + 3); // the Thursday of this week decides the year
  const year = d.getFullYear();
  const firstThursday = new Date(year, 0, 4);
  const week = 1 + Math.round(((d.getTime() - firstThursday.getTime()) / 864e5 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** The Monday of an ISO week (`2026-W42` → `2026-10-12`). */
export function weekStart(id: string): string {
  const m = /^(\d{4})-W(\d{2})$/.exec(id || '');
  if (!m) return '';
  const jan4 = new Date(Number(m[1]), 0, 4);
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (Number(m[2]) - 1) * 7);
  return isoOf(monday);
}

/** "12–18 Oct" (or "28 Sep – 4 Oct") for a week, in the language. */
export function weekRangeLabel(language: string, id: string): string {
  const start = weekStart(id);
  if (!start) return id;
  const end = addDays(start, 6);
  try {
    // the browser knows how each language writes a range of days ("12–18 Oct", "Oct 12 – 18", "12.–18. okt.")
    const format: any = new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short' });
    if (typeof format.formatRange === 'function') return format.formatRange(dateOf(start), dateOf(end));
    const sameMonth = start.slice(0, 7) === end.slice(0, 7);
    const day = (iso: string, withMonth: boolean) => dateOf(iso).toLocaleDateString(language, withMonth ? { day: 'numeric', month: 'short' } : { day: 'numeric' });
    return sameMonth ? `${day(start, false)}–${day(end, true)}` : `${day(start, true)} – ${day(end, true)}`;
  } catch (e) {
    return `${start} – ${end}`;
  }
}

/** Short month names in the language ("Jan" … "Dec"). */
export function monthNames(language: string): string[] {
  const names: string[] = [];
  for (let m = 0; m < 12; m++) {
    try {
      const name = new Date(2024, m, 1).toLocaleDateString(language, { month: 'short' }).replace('.', '');
      names.push(name.charAt(0).toLocaleUpperCase(language) + name.slice(1));
    } catch (e) {
      names.push(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m]);
    }
  }
  return names;
}

/** "October 2026" for a `2026-10` month answer. */
export function monthLabel(language: string, id: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(id || '');
  return m ? monthTitle(language, Number(m[1]), Number(m[2]) - 1) : id;
}
