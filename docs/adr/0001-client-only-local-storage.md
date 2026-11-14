---
tags: [expenses-tracker, persistence, architecture]
title: "ADR-0001: Client-only local-first persistence"
status: accepted
date: 2026-05-24
---

# ADR-0001: Client-only local-first persistence

## Status

accepted

## Context

expenses-tracker is a proof-of-concept for tracking daily personal expenses. The primary user need is fast capture and review on a single device, without sign-up friction or infrastructure cost.

The app has no backend, no database, and no sync requirements at this stage. Data must survive page refreshes within the same browser.

## Decision

Persist all expense data **client-side only**, using the browser's `localStorage` API.

- Storage key: `expenses-tracker:data:v1` — one versioned JSON document (shape and migration from the original `daily-expenses-*` keys in [ADR-0012](./0012-domain-model-v1.md))
- Read through `useSyncExternalStore`; every action writes the whole document
- "Clear transactions" empties the transaction list only

There is no server, no API layer, and no cross-device sync in the POC.

## Consequences

### Positive

- Zero backend cost and no deployment complexity for data
- Instant reads and writes — no network latency
- Works offline by default
- Simple mental model for a single-user personal tracker

### Negative

- Data is tied to one browser on one device; clearing site data loses everything
- No backup or multi-device sync (CSV export is a monthly summary, not a backup)
- `localStorage` has a ~5 MB limit (unlikely to hit for daily expenses, but a hard ceiling)
- No server-side validation or audit trail

## Alternatives considered

### IndexedDB

Better for large datasets and structured queries. Rejected for POC because expense volume is small and `localStorage` keeps the persistence layer trivial to implement and debug.

### Backend + database (e.g. PostgreSQL, Supabase)

Enables multi-device sync, auth, and backups. Rejected for POC to avoid premature infrastructure. Revisit when sync or multi-user becomes a requirement — see ADR-0003.

### Server Actions / API routes with file or DB storage

Adds a server layer without full auth. Rejected because the POC goal is validating the UX and domain model, not deployment topology.

## Migration criteria

Revisit this decision when any of the following become requirements:

- Multi-device or multi-browser access to the same data
- Shared household or team expense tracking
- Data export/import as a first-class feature
- More than ~1 000 expenses with client-side filtering performance concerns
