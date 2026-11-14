---
tags: [expenses-tracker, domain, persistence]
title: "ADR-0012: Domain model v1 and legacy data migration"
status: accepted
date: 2026-11-14
supersedes: [ADR-0005, ADR-0009]
---

# ADR-0012: Domain model v1 and legacy data migration

## Status

accepted — supersedes [ADR-0005](./0005-expense-domain-model.md) and [ADR-0009](./0009-user-defined-categories.md)

## Context

ADR-0005 stored dates as `es-ES` strings and listed editing, CSV export, and date ranges as reasons to migrate. ADR-0009 deferred category rename and delete. The new app needs all of these, plus income, goals, recurring bills, and accounts. Existing users have data under the old keys that must not be lost.

## Decision

### One versioned document

All data lives in one JSON document in `localStorage` under `expenses-tracker:data:v1` (types in `lib/domain/types.ts`):

```typescript
interface AppData {
  version: 1;
  categories: Category[];        // { id, name, color, type: "expense" | "income" }
  transactions: Transaction[];   // { id, amount, categoryId, date: ISODate, note }
  budgets: Record<string, number>; // categoryId → monthly limit
  goals: Goal[];
  recurring: RecurringItem[];
  accounts: Account[];
  netWorthHistory: NetWorthSnapshot[];
}
```

- **Dates** are ISO `YYYY-MM-DD`; months are `YYYY-MM`. Formatting happens only at display time (ADR-0010).
- **IDs** come from `crypto.randomUUID()`.
- **Amounts** are positive numbers. A transaction's type (expense or income) comes from its category and is not stored on the transaction, so the two can't disagree.

### Categories

- Full create, rename, recolor, and delete.
- Names are unique across expense and income categories, compared case-insensitively.
- A category's type can't change while transactions or recurring items use it.
- Deleting a category in use requires picking another category of the same type. Its transactions and recurring items move there, and its budget is removed. If no other category of that type exists, delete is blocked.

### Budgets

- One monthly limit per expense category, the same every month (unchanged intent from `docs/specs/category-budgets.md`).
- Status: below 80% is ok, 80–100% is warning, over 100% is over. **Exactly 100% is a warning**, not over. This differs from the old spec (`>= 1` was red): spending the whole budget is on target, not over it.
- Budget editing moved from the transaction form to the Budgets page. The form keeps the read-only hint: spent this month plus the amount being typed, against the limit.

### Persistence behavior

- The store is read through `useSyncExternalStore` and synced across tabs with the `storage` event.
- Unreadable stored data is copied to `expenses-tracker:data:v1:unreadable-<timestamp>` before being replaced, never dropped silently.
- "Clear transactions" keeps categories, budgets, goals, bills, and accounts.

### Migration from the POC keys

On first load, if `expenses-tracker:data:v1` is missing:

1. If any of `daily-expenses-es`, `daily-expenses-categories-es`, or `daily-expenses-budgets-es` exist, migrate them:
   - `d/m/yyyy` dates become ISO; expenses with unparseable dates are dropped.
   - Category names, from the list and from expenses, are deduplicated case-insensitively and become expense categories with palette colors. Expenses with no category go to "Sin categoría".
   - The old placeholder note "Sin descripción" becomes an empty note.
   - Budgets are re-keyed from category name to id.
   - The default income categories are added so income can be recorded.
2. Otherwise, seed demo data.

The old keys are **left untouched**, so rolling back to the POC still works.

### CSV export

Kept as in the POC: a per-category summary of the selected month's expenses, with a total row. It uses a `;` delimiter, `,` decimals, and a UTF-8 BOM so Spanish Excel opens it correctly. These settings come from the dictionary.

## Consequences

### Positive

- Sortable, locale-agnostic dates; editing and date-range queries are straightforward.
- Renaming a category is one field change, since transactions reference it by id.
- Users of the POC keep their data with no manual step.

### Negative

- Migration is one-way. Changes made in the new app don't flow back to the old keys.
- One document means every write serializes all data. Fine for years of personal use; revisit around a few thousand transactions.
- A schema change needs a `version` bump and a migration step.

## Alternatives considered

### Keep category as a name string on each transaction

Simpler migration. Rejected — renaming would have to rewrite every transaction.

### Soft-delete categories

Keeps history intact. Rejected for now — reassigning on delete is simpler to explain and keeps every transaction categorized.

### Delete the legacy keys after migration

Cleaner storage. Rejected — keeping them costs a few KB and makes rollback safe.

## When to revisit

When data moves to a server, when budgets need per-month overrides, or when multi-currency is needed.
