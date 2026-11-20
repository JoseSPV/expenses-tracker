---
tags: [expenses-tracker, auth]
title: "ADR-0014: Google sign-in, trial stays in the browser"
status: accepted
date: 2026-11-19
supersedes: ADR-0003
---

# ADR-0014: Google sign-in, trial stays in the browser

## Status

accepted — supersedes [ADR-0003](./0003-no-authentication.md)

## Context

The same person wants their books on the phone and the computer, without running a server or sharing a password. The no-account trial already works in one browser ([ADR-0001](./0001-client-only-local-storage.md)). The product rules for accounts and books are written in [the accounts spec](../specs/accounts-and-books-design.md).

## Decision

Signing in is Google, through Supabase. The trial without an account stays in this browser.

- «Tus libros», on Perfil, starts Google. The return route is `/auth/callback`. It exchanges the code for a session and does not forward the code.
- The session is an HttpOnly cookie. `proxy.ts` refreshes it. The server reads `getClaims()`, not `getSession()`.
- The browser receives only the project URL and the publishable key (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). The URL must be `https://…supabase.co`. A service-role key is refused.
- Sign-in is limited to `ALLOWED_GOOGLE_EMAILS`, a server-only variable. It is not part of the client bundle. An empty list allows nobody.
- `features/` does not import the Supabase client. The shell starts sign-in. The server reads who is signed in.
- A signed-in person sees the eight sections empty. The trial is not shown and is not copied. What they add is stored in this browser, apart from the trial, until the account itself stores it. Invites and deleting the account are not stored yet.

## Consequences

### Positive

- One Google account is the identity on every device.
- The trial still needs no account and no network.
- The key that bypasses access rules never ships in the app.

### Negative

- Signed-in use needs a network. There is no offline book yet.
- The two public values must be set locally and, later, on the existing Vercel project. The service-role key stays in Supabase.
- ADR-0001 still describes the trial. It does not describe a signed-in book.

## Alternatives considered

### Stay without accounts

Rejected. The product needs the same books on the phone and the computer.

### Email and password

Rejected. The person does not manage a password. Google is the only sign-in.
