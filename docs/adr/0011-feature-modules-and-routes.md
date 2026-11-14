---
tags: [expenses-tracker, architecture]
title: "ADR-0011: Feature modules, one route per section"
status: accepted
date: 2026-11-14
supersedes: ADR-0008
---

# ADR-0011: Feature modules, one route per section

## Status

accepted — supersedes [ADR-0008](./0008-monolithic-page-for-poc.md)

## Context

ADR-0008 listed extraction triggers: a second route, shared logic, or a page over ~600 lines. All of them now apply. The app has eight sections (summary, transactions, budgets, goals, bills, net worth, calculators, categories), and they share data, the selected month, and dialogs.

## Decision

Split the app into layers with one direction of dependency: `app` → `features` → `components` / `lib`.

```
app/[lang]/<section>/page.tsx   → thin server page: metadata + the feature view
features/<section>/             → client views and dialogs for one section
components/ui/                  → generic primitives (Button, Card, Dialog, Progress…)
components/charts/              → SVG charts (bar, line, donut)
components/layout/              → app shell, navigation, month context, theme
lib/domain/                     → pure rules: types, dates, selectors, budgets, finance math
lib/store/                      → localStorage store, actions, seed, legacy migration
i18n/                           → config, dictionaries, formatters, provider
```

Rules:

- **Pages are thin.** They export `generateMetadata` and render one view. No logic.
- **`lib/domain` is pure.** No React, no storage, no `Date.now()` hidden in selectors; callers pass the month or date.
- **State goes through the store.** Views read with `useAppData()` and write through `lib/store/actions.ts`. No component touches `localStorage`.
- **The selected month** is shared through `MonthProvider` and kept as an offset from the current month, so it stays valid across midnight.
- **Hydration** — data and the month are `null` on the server and the first client render. Views show a skeleton until then, which avoids hydration mismatches from `localStorage` and today's date.
- Features do not import from each other, except shared pieces like `features/categories/category-select.tsx` and the transaction dialog the shell opens.

## Consequences

### Positive

- Business rules in `lib/domain` are testable without React.
- Each section can change without touching others.
- New sections follow the same recipe: route, nav item, feature folder, dictionary keys.

### Negative

- More files and indirection than the single-page POC.
- Pages are statically generated but render only a skeleton until the client loads data. Expected for a client-only app (ADR-0001).

## Alternatives considered

### Keep one page with tabs

Fewer files. Rejected — sections need their own URLs, titles, and back-button behavior.

### Global state library (Zustand, Redux)

Rejected — `useSyncExternalStore` over one localStorage snapshot is enough, with no dependency.

## When to revisit

When data moves to a server (store actions become Server Actions or API calls), or when a test runner is added and `lib/domain` gets unit tests.
