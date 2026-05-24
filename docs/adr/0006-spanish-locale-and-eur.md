---
tags: [expenses-tracker, i18n, domain]
title: "ADR-0006: Spanish locale and EUR currency"
status: accepted
date: 2026-05-24
---

# ADR-0006: Spanish locale and EUR currency

## Status

accepted

## Context

The app is a personal daily expense tracker built for a Spanish-speaking user. Copy, date formatting, and currency display should feel native — not like a generic English app with translated labels bolted on.

There is no multi-language requirement in the POC.

## Decision

Hardcode **Spanish (Spain) locale** and **EUR** as the only locale and currency.

- UI copy in Spanish: e.g. "Gastos diarios", "Añadir gasto", "Confirmar borrado"
- Amount formatting: `Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" })`
- Date formatting: `toLocaleDateString("es-ES")` for display and storage
- Storage key suffix: `daily-expenses-es` reflects the locale-scoped dataset
- Default description when empty: `"Sin descripción"`

No i18n library (next-intl, react-i18next, etc.) — strings are inline in components.

Note: `app/layout.tsx` still has `lang="en"` and English scaffold metadata — layout-level i18n was not updated in the first draft.

## Consequences

### Positive

- Zero i18n framework overhead
- Formatting matches user expectations (€ symbol, Spanish date order)
- Clear scope — one language, one currency

### Negative

- Adding English or other locales requires extracting all strings and formatting config
- Multi-currency support would need amount + currency code on each expense
- Layout `lang` attribute mismatch (`en` vs Spanish content) is a minor accessibility inconsistency

## Alternatives considered

### next-intl or similar i18n framework

Proper extraction, pluralization, and locale routing. Rejected for POC — single locale does not justify the dependency and file structure.

### Store locale-agnostic ISO dates, format at display time

Better long-term (see ADR-0005). Partially violated — dates are stored as formatted es-ES strings for simplicity.

### USD or locale from browser `navigator.language`

Generic/international approach. Rejected — product intent is a personal Spanish EUR tracker.

## When to revisit

When supporting multiple languages, currencies, or locale-specific category names stored in user data.
