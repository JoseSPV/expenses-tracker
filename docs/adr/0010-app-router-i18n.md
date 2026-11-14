---
tags: [expenses-tracker, i18n, framework]
title: "ADR-0010: Locale routing and dictionaries with the App Router"
status: accepted
date: 2026-11-14
supersedes: ADR-0006
---

# ADR-0010: Locale routing and dictionaries with the App Router

## Status

accepted — supersedes [ADR-0006](./0006-spanish-locale-and-eur.md)

## Context

The app grew from one screen to eight sections. Copy was inline in components, dates were stored as `es-ES` strings, and `<html lang>` was wrong. Spanish is still the only language, but adding another locale should not mean touching every component again.

## Decision

Use the Next.js App Router's built-in i18n pattern, without an i18n library.

- **Routing** — every page lives under `app/[lang]/`. `app/[lang]/layout.tsx` is the root layout, sets `<html lang>`, uses `generateStaticParams` over `locales`, and sets `dynamicParams = false`. Unknown paths under a locale go to the localized `not-found`.
- **Proxy** — `proxy.ts` redirects any path without a locale prefix to the best match from `Accept-Language`, falling back to `defaultLocale`.
- **Config** — `i18n/config.ts` holds `locales` (`["es"]`), `defaultLocale`, `hasLocale`, the formatting locale per locale (`es` → `es-ES`), and `CURRENCY` (`EUR`).
- **Dictionaries** — one JSON file per locale in `i18n/dictionaries/`. `Dictionary` is `typeof es.json`, so a missing key in a new locale is a type error. Server code loads it with `getDictionary()`, which reads the locale from `next/root-params`.
- **Client access** — the layout passes the dictionary to `I18nProvider`; components call `useI18n()` for `{ locale, dict, format }`.
- **Formatting** — `i18n/formatters.ts` wraps `Intl` (currency, compact numbers, percent, dates, relative time, plural rules) plus `message()` for `{var}` interpolation. Components never call `toLocaleString` directly.
- **Stored data is locale-agnostic** — ISO dates and numbers only (see [ADR-0012](./0012-domain-model-v1.md)). Demo data names come from `dict.seed`, so they are created in the active language.
- **URL segments stay in English** (`/es/transactions`). Translated slugs are not worth the routing complexity yet.
- **Currency stays EUR** for every locale.

## Consequences

### Positive

- Adding a locale = add it to `locales`, add a JSON file, done. TypeScript flags missing keys.
- All pages are statically generated per locale.
- Correct `lang` attribute and localized `<title>` per page.

### Negative

- The whole dictionary ships to the client (about 10 KB). Fine at this size; split it per route if it grows.
- User-created data (category names, notes) is not translated. Switching locale keeps the names the user typed.
- English URL segments under a Spanish locale.

## Alternatives considered

### next-intl

Mature, with ICU messages and typed keys. Rejected — the built-in pattern covers one or two locales with no dependency, and `Intl` handles plurals and formatting.

### Keep inline Spanish (ADR-0006)

Rejected — the user asked for Next's i18n so more languages can be added.

### Locale from cookie or `navigator.language` without a URL prefix

No URL change. Rejected — locale in the path is the App Router convention, works with static generation, and makes links shareable.

## When to revisit

When adding a second locale (decide on translated slugs and a language switcher), or when user data needs per-locale names.
