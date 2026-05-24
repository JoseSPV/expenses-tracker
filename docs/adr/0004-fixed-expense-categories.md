---
tags: [expenses-tracker, domain]
title: "ADR-0004: Fixed expense category taxonomy"
status: accepted
date: 2026-05-24
---

# ADR-0004: Fixed expense category taxonomy

## Status

accepted

## Context

Expenses need optional categorization for filtering and at-a-glance understanding (e.g. "how much did I spend on restaurants this month?"). Categories must be consistent enough for filters to work reliably.

The target user is Spanish-speaking and tracks common daily spending types: food, transport, home, clothing, etc.

## Decision

Use a **fixed, hardcoded category list** defined in source code as the `CATEGORIAS` constant:

- Restaurantes
- Cafeterías
- Supermercados
- Droguería
- Taxi
- Hoteles
- Autobús
- Hogar
- Ropa

Rules:

- Category is **optional** when creating an expense (empty string if unset)
- Users cannot add, rename, or delete categories in the POC
- The same list drives both the create-form dropdown and the filter checkboxes
- Category values are stored as plain strings on each expense record

## Consequences

### Positive

- Predictable filter behavior — no orphan or typo categories
- Zero category-management UI to build
- Simple data model — category is just a string field

### Negative

- Cannot adapt categories to individual spending habits without a code change
- Renaming a category in code does not migrate existing stored expenses
- No hierarchy (e.g. "Transporte" → Taxi, unlike Taxi, Autobús") — flat list only

## Alternatives considered

### User-defined categories (CRUD)

Flexible but requires category storage, validation, delete-with-expenses policy, and UI. Deferred until post-POC when personalization is validated as a need.

### Category enum with TypeScript union type

Stricter typing than `string`. Partially adopted in spirit (fixed list) but stored as `string` on `Expense` for JSON serialization simplicity. Could tighten types later without changing persistence.

### Hierarchical categories

Better for reporting at scale. Rejected — daily expense tracking for a POC does not need category trees.

## When to revisit

When users need custom categories, or when categories must be managed without redeploying the app (requires persistence layer for category definitions).
