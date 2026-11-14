export const locales = ["es"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es";

export const hasLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

/** BCP 47 tag used by `Intl` for numbers and dates in each locale. */
export const formattingLocale: Record<Locale, string> = {
  es: "es-ES",
};

export const CURRENCY = "EUR";
