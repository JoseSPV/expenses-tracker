---
tags: [expenses-tracker, domain, persistence]
title: "ADR-0015: Investment portfolio per book"
status: accepted
date: 2026-11-24
---

# ADR-0015: Investment portfolio per book

## Status

accepted

## Context

Users want to track holdings with buys, sells and dividends, see unrealized gains, and see what they realized in the current year. Holdings are often in USD. Spanish tax rules use FIFO for the cost of a sale. Data belongs to a book (see `docs/specs/accounts-and-books-design.md`), and the book and member tables do not exist in Supabase yet. ADR-0012 assumed a single currency (EUR).

Spec: [`docs/specs/investment-portfolio.md`](../specs/investment-portfolio.md).

## Decision

- **Ownership.** The portfolio belongs to the book. Every member can read and edit it. Rows record `updatedBy`.
- **Model.** Two new entities: `Instrument` (ticker, name, currency, optional manual price with its date and EUR rate) and `InvestmentTransaction` (a union of `buy | sell | dividend`). `AppData` moves to `version: 2`. The migration adds empty arrays.
- **Multi-currency per operation, EUR frozen at save.** Each operation stores its original amounts (instrument currency), that day's `eurRate`, and an `eur` block with the EUR equivalents. The form proposes the EUR figures from the rate; the user can overwrite them to match the broker statement. Once saved, the `eur` block is the source of truth for FIFO and tax figures and is never recomputed from the rate. Fees are on every operation, in EUR or in the instrument currency. Spanish withholding is recorded in EUR only. This narrows ADR-0012's single-currency assumption to this section only.
- **FIFO, pure.** Lots, realized gains, positions and the yearly totals live in `lib/domain/portfolio.ts`, without React or I/O. Writes that would leave a sell without shares are rejected as `invalid`.
- **Manual prices.** No market-data API. A position without a price is never valued at market. It counts at cost and is labelled as such.
- **Net worth.** The portfolio value is a computed asset row in Net worth, included in the monthly snapshot.
- **Aggregates computed on the client, including with Supabase.** The books design asks for server aggregates. This section is an exception: FIFO depends on the order of every operation of an instrument, the volume is small (hundreds of rows per book), and duplicating the rules in SQL would create two sources of truth. The view loads the book's instruments and operations and computes with the same domain module used by the trial.
- **Supabase deferred.** The tables `instruments` and `investment_transactions` (with `book_id`, `version`, `updated_by`) and their RLS by book membership are created after the book and member tables exist.

## Consequences

### Positive

- One implementation of FIFO, tested in isolation, shared by the trial and the cloud.
- Correct EUR gains on USD holdings, since buy and sell rates differ.
- EUR acquisition and transfer values match the broker statement to the cent, which the tax return needs.
- No external dependency or API key.

### Negative

- Prices go stale unless updated by hand, and unrealized gains are only as fresh as the last price.
- The cloud version reads all portfolio rows of a book at once, unlike the other sections.
- `AppData` version bump: one more migration step.
- Not a tax tool: no two-month rule for losses and no relief for foreign withholding.

## Alternatives considered

### Store only the rate and derive EUR on read

Less data. Rejected — rounding and broker rates differ by cents from `quantity × price × rate`, and a tax figure must not shift after the fact.

### Average cost

Simpler. Rejected — it does not match how gains are declared in Spain.

### Market-data API

Live values. Rejected for now — it needs a key, a server route, caching and a provider choice. It can be added later behind the same `price` field.

### Portfolio owned by the account instead of the book

Private within a shared book. Rejected — the book is the unit of sharing and access everywhere else.

### Server-side FIFO in SQL

Matches the "aggregates on the server" rule. Rejected — it duplicates order-dependent rules for a small dataset.

## When to revisit

When a price API is wanted, when a book passes a few thousand operations, or when splits, scrip dividends or tax reporting are in scope.
