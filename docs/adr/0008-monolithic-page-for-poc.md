---
tags: [expenses-tracker, architecture]
title: "ADR-0008: Monolithic page component for POC scope"
status: accepted
date: 2026-05-24
---

# ADR-0008: Monolithic page component for POC scope

## Status

accepted

## Context

The entire expenses-tracker feature — state, persistence, business rules, and UI — fits in roughly 400 lines. The POC goal is speed and validation, not maintainability at team scale.

Splitting into layers prematurely can add indirection without clarifying the domain.

## Decision

Co-locate **all feature logic in `app/page.tsx`** as a single `"use client"` component (`DailyExpensesApp`).

Included in one file today:

- `Expense` interface and `CATEGORIAS` constant
- React state (`useState`) for form, list, filters, and modals
- `useEffect` hooks for localStorage load/save and click-outside handling
- CRUD handlers (`addExpense`, `deleteExpense`, `confirmClearAll`)
- Filter logic and total calculation
- Complete JSX for form, list, filters, and confirm modal

State management is **local React state only** — no Zustand, Redux, TanStack Query, or context providers.

## Consequences

### Positive

- Single file to read for full feature understanding
- No abstraction tax while the domain model is still stabilizing
- Fast iteration — change UI and logic in one place

### Negative

- Harder to unit test business logic in isolation
- Will not scale if routes, shared state, or server data fetching are added
- Types and constants are not reusable from other modules
- Merge conflict risk if multiple contributors edit the same file

## Alternatives considered

### Feature folders (`features/expenses/`, hooks, services)

Standard scalable structure. Deferred until a second route or shared logic appears.

### Custom hooks (`useExpenses`, `useLocalStorage`)

Reduces page size without folder proliferation. Reasonable next step before full feature extraction — not done in POC.

### Server Components for static shell + client island

Split layout from interactive form. Minimal benefit today since nearly everything is interactive.

## Extraction triggers

Refactor out of the monolith when any of these occur:

- A second page or route needs expense data
- Business logic is unit tested independently
- Server-side data fetching replaces localStorage
- `app/page.tsx` exceeds ~600 lines or mixes unrelated concerns

Suggested first extraction order: `lib/types.ts` → `lib/storage.ts` → `hooks/useExpenses.ts` → presentational components.
