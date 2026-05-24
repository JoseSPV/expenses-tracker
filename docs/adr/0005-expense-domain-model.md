---
tags: [expenses-tracker, domain, persistence]
title: "ADR-0005: Expense entity shape"
status: accepted
date: 2026-05-24
---

# ADR-0005: Expense entity shape

## Status

accepted

## Context

The core domain object is the **Expense**. Its fields determine what can be stored, displayed, filtered, and migrated later. The POC optimizes for simplicity over long-term query flexibility.

## Decision

Define `Expense` with the following shape:

```typescript
interface Expense {
  id: number;           // Date.now() at creation time
  amount: number;       // parsed float, required
  description: string;  // defaults to "Sin descripción" if empty
  category: string;     // optional; empty string if unset (see ADR-0004)
  date: string;         // es-ES formatted display string (see ADR-0006)
}
```

Behavioral rules:

- **Create**: prepend to list (newest first)
- **Delete**: remove by `id`
- **ID generation**: `Date.now()` — numeric, monotonic in normal use
- **Amount validation**: reject non-numeric input on create
- **Totals**: sum `amount` over filtered list (client-side reduce)

Types live inline in `app/page.tsx` today — no shared schema package.

## Consequences

### Positive

- Minimal fields — easy to understand and serialize to JSON
- Newest-first ordering matches "recent activity" mental model
- Numeric `id` is simple for delete operations

### Negative

- **`date` as display string** — not ISO 8601. Sorting and date-range queries require parsing locale strings or a future migration to canonical timestamps
- **`Date.now()` IDs** — collision possible if two expenses are created in the same millisecond (unlikely manually, possible programmatically)
- **No `createdAt` / `updatedAt`** — no audit trail or edit history
- **No amount precision policy** — JavaScript float; fine for EUR display, problematic for strict accounting

## Alternatives considered

### ISO date string (`YYYY-MM-DD`) or Unix timestamp

Canonical, sortable, locale-agnostic. Rejected for POC in favor of storing exactly what is displayed. **Known technical debt** — migrate before adding date-range reports.

### UUID for `id`

Collision-safe, standard for distributed systems. Rejected — overkill for client-only local storage with sequential user input.

### Separate `lib/types.ts` or Zod schema

Better for reuse when splitting the monolith. Deferred until code is extracted from `app/page.tsx` (see ADR-0008).

## When to revisit

Before adding: expense editing, date-range filters, export to CSV, or server-side sync (canonical date and stable IDs become requirements).
