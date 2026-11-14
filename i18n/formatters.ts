import { daysBetween, parseISO, today } from "@/lib/domain/dates";
import { CURRENCY, formattingLocale, type Locale } from "./config";
import type { Dictionary, PluralForms } from "./types";

type MessageValues = Record<string, string | number>;

export function message(template: string, values: MessageValues = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

export function createFormatters(locale: Locale, dict: Dictionary) {
  const tag = formattingLocale[locale];
  const currency = new Intl.NumberFormat(tag, { style: "currency", currency: CURRENCY, useGrouping: "always" });
  const compactCurrency = new Intl.NumberFormat(tag, {
    style: "currency",
    currency: CURRENCY,
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const percent = new Intl.NumberFormat(tag, { style: "percent", maximumFractionDigits: 0 });
  const decimal = new Intl.NumberFormat(tag, { maximumFractionDigits: 1 });
  const relative = new Intl.RelativeTimeFormat(tag, { numeric: "auto" });
  const pluralRules = new Intl.PluralRules(tag);
  const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase(tag) + text.slice(1);

  return {
    money: (amount: number) => currency.format(amount),
    compactMoney: (amount: number) => compactCurrency.format(amount),
    /** `ratio` is a fraction: 0.45 → "45 %". */
    percent: (ratio: number) => percent.format(Number.isFinite(ratio) ? ratio : 0),
    decimal: (value: number) => decimal.format(value),
    date: (iso: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) =>
      parseISO(iso).toLocaleDateString(tag, options),
    month: (monthKey: string) =>
      capitalize(parseISO(monthKey).toLocaleDateString(tag, { month: "long", year: "numeric" })),
    shortMonth: (monthKey: string) => parseISO(monthKey).toLocaleDateString(tag, { month: "short" }),
    dueIn: (iso: string) => {
      const days = daysBetween(today(), iso);
      const text = relative.format(days, "day");
      return capitalize(days < 0 ? message(dict.common.overdue, { relative: text }) : text);
    },
    message,
    plural: (forms: PluralForms, count: number, values: MessageValues = {}) => {
      const category = pluralRules.select(count);
      const template = category === "one" ? forms.one : forms.other;
      return message(template, { count, ...values });
    },
  };
}

export type Formatters = ReturnType<typeof createFormatters>;
