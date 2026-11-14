"use client";

import { createContext, use, useMemo, type ReactNode } from "react";
import type { Locale } from "./config";
import { createFormatters, type Formatters } from "./formatters";
import type { Dictionary } from "./types";

interface I18nValue {
  locale: Locale;
  dict: Dictionary;
  format: Formatters;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({ locale, dict, format: createFormatters(locale, dict) }),
    [locale, dict],
  );
  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18n(): I18nValue {
  const value = use(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>");
  return value;
}
