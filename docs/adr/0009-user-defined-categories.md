---
tags: [expenses-tracker, domain, persistence]
title: "ADR-0009: User-defined expense categories"
status: accepted
date: 2026-05-24
supersedes: ADR-0004
---

# ADR-0009: User-defined expense categories

## Status

accepted — supersedes [ADR-0004](./0004-fixed-expense-categories.md)

## Context

Users need to adapt categories to their own spending habits without redeploying the app. ADR-0004 fixed categories in source code; that constraint is no longer acceptable for the product direction.

The app remains client-only (ADR-0001), so category definitions must persist in the browser alongside expenses.

## Decision

Allow users to **add custom categories** at runtime.

- **Default seed list** — `DEFAULT_CATEGORIAS` in code provides initial categories for new users (same nine defaults as ADR-0004)
- **Persistence** — categories stored in `localStorage` under key `daily-expenses-categories-es` as a JSON string array
- **Single list** — the same `categories` state drives the create-form dropdown and filter checkboxes
- **Add flow** — input + "Añadir" button at the bottom of the category dropdown; Enter key submits
- **Validation** — trim whitespace; reject empty; case-insensitive duplicate check (select existing if duplicate)
- **Migration** — on load, merge any category strings found on stored expenses into the category list (covers legacy data)
- **Clear all** — deleting all expenses does **not** reset the category list

Category on each expense remains an optional plain `string` field (ADR-0005 unchanged).

No delete or rename of categories in this iteration — unused categories may remain in the list.

## Consequences

### Positive

- Personalization without backend or redeploy
- Consistent filters — new categories appear immediately in both dropdowns
- Legacy expenses with category strings are preserved and surfaced in the list

### Negative

- Category list can accumulate unused entries (no delete/rename yet)
- Case-insensitive dedup means "Taxi" and "taxi" collapse to one entry
- Categories are not synced across devices (same limitation as expenses)

## Alternatives considered

### Keep fixed list (ADR-0004)

Rejected — user need for custom categories validated in product iteration.

### Derive categories only from expense records

No explicit list storage — categories inferred from unique `expense.category` values. Rejected because users should be able to pre-create categories before first use.

### Full category CRUD (delete/rename)

Better long-term hygiene. Deferred — add-only is sufficient for current scope; delete/rename needs policy for existing expenses.

## When to revisit

When users need to delete or rename categories, or when categories move to server-side storage with sync.
