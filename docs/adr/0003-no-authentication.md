---
tags: [expenses-tracker, auth]
title: "ADR-0003: No authentication for POC"
status: accepted
date: 2026-05-24
---

# ADR-0003: No authentication for POC

## Status

accepted

## Context

expenses-tracker targets a single person tracking daily personal expenses on their own device. Combined with client-only persistence (ADR-0001), there is no server-side data to protect and no concept of multiple users.

Adding authentication now would introduce session management, identity providers, and security surface area without a corresponding user need.

## Decision

**Do not implement authentication** in the POC.

- No user accounts, login, or sessions
- No authorization checks
- Data isolation is implicit: each browser's `localStorage` is its own silo
- The app is usable immediately with no sign-up step

## Consequences

### Positive

- Fastest path to a working product — no auth UX or infrastructure
- No secrets, OAuth apps, or session storage to manage
- Aligns with local-first persistence model

### Negative

- Cannot share data between users or devices
- No way to recover data if browser storage is cleared (without a future backup feature)
- Adding auth later requires a migration path from anonymous local data to user-owned server data

## Alternatives considered

### Magic link / OAuth (Google, GitHub)

Standard for personal SaaS apps. Deferred until a backend and sync layer exist — auth without server-side storage adds complexity without benefit.

### Passkey or PIN lock (client-only)

Local app lock without a server. Rejected for POC — the threat model (shared device snooping) is out of scope for v0.

### Multi-user local profiles

Multiple named profiles in `localStorage`. Rejected — adds UX complexity without the sync/backup benefits that usually motivate multi-user support.

## When to revisit

Introduce authentication when ADR-0001 is superseded by server-side persistence and users need to access the same expense data from multiple devices or browsers.
