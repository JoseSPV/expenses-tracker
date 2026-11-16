import type { Frequency, ISODate, MonthKey } from "./types";

const DAY_MS = 86_400_000;

const pad = (n: number) => String(n).padStart(2, "0");

export const toISO = (date: Date): ISODate =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/**
 * Normalizes `Y-M-D` to `YYYY-MM-DD`. A 1- or 2-digit year is expanded (26 → 2026).
 * Anything else is returned unchanged.
 */
export function canonicalizeDate(value: string): string {
  const match = /^(\d{1,4})-(\d{1,2})-(\d{1,2})$/.exec(value.trim());
  if (!match) return value;
  let year = Number(match[1]);
  if (year < 100) year += year < 70 ? 2000 : 1900;
  return `${year}-${pad(Number(match[2]))}-${pad(Number(match[3]))}`;
}

export const today = (): ISODate => toISO(new Date());

export const monthKey = (iso: ISODate): MonthKey => iso.slice(0, 7);

export const currentMonth = (): MonthKey => monthKey(today());

export const dayOfMonth = (iso: ISODate): number => Number(iso.slice(8, 10));

/** Accepts `YYYY-MM-DD` or `YYYY-MM` (first day of the month). */
export function parseISO(iso: string): Date {
  const [y, m, d = 1] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: ISODate, days: number): ISODate {
  const date = parseISO(iso);
  date.setDate(date.getDate() + days);
  return toISO(date);
}

export function addMonths(month: MonthKey, n: number): MonthKey {
  const [y, m] = month.split("-").map(Number);
  return monthKey(toISO(new Date(y, m - 1 + n, 1)));
}

export function daysInMonth(month: MonthKey): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

/** True only for a real calendar day, so `2026-02-31` never gets stored. */
export function isISODate(value: string): value is ISODate {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  if (month < 1 || month > 12 || day < 1) return false;
  return day <= daysInMonth(value.slice(0, 7));
}

/** The given day in `month`, clamped to the month's last day. */
export const dateInMonth = (month: MonthKey, day: number): ISODate =>
  `${month}-${pad(Math.min(day, daysInMonth(month)))}`;

const addMonthsToDate = (iso: ISODate, n: number): ISODate =>
  dateInMonth(addMonths(monthKey(iso), n), dayOfMonth(iso));

/** Next date after `from` that falls on `day` of a month. */
export function nextOccurrence(day: number, from: ISODate = today()): ISODate {
  const candidate = dateInMonth(monthKey(from), day);
  return candidate > from ? candidate : dateInMonth(addMonths(monthKey(from), 1), day);
}

export function nextDueDate(iso: ISODate, frequency: Frequency): ISODate {
  if (frequency === "weekly") return addDays(iso, 7);
  if (frequency === "yearly") return addMonthsToDate(iso, 12);
  return addMonthsToDate(iso, 1);
}

export const daysBetween = (from: ISODate, to: ISODate): number =>
  Math.round((parseISO(to).getTime() - parseISO(from).getTime()) / DAY_MS);

export function monthsBetween(from: ISODate, to: ISODate): number {
  const a = parseISO(from);
  const b = parseISO(to);
  return (
    (b.getFullYear() - a.getFullYear()) * 12 +
    (b.getMonth() - a.getMonth()) -
    (b.getDate() < a.getDate() ? 1 : 0)
  );
}
