---
tags: [expenses-tracker, framework, architecture]
title: "ADR-0002: Next.js App Router as application shell"
status: accepted
date: 2026-05-24
---

# ADR-0002: Next.js App Router as application shell

## Status

accepted

## Context

The project started from Create Next App and needs a modern React toolchain with TypeScript, fast local dev, and a straightforward path to production deployment (Vercel).

The current feature set is a single screen. The framework choice should not over-engineer routing or server rendering for a client-heavy POC, but should leave room to grow.

## Decision

Use **Next.js 16 with the App Router** (`app/` directory) as the application shell.

- `app/[lang]/layout.tsx` — root layout per locale: fonts, metadata, theme script, providers ([ADR-0010](./0010-app-router-i18n.md))
- `app/[lang]/<section>/page.tsx` — one thin server page per section ([ADR-0011](./0011-feature-modules-and-routes.md))
- `proxy.ts` — redirects paths without a locale prefix
- `app/globals.css` — Tailwind v4 entry and theme tokens ([ADR-0013](./0013-design-tokens-and-theming.md))
- Path alias `@/*` maps to project root

Pages and metadata are server components and statically generated; the feature views are client components because data lives in `localStorage` (ADR-0001). No API routes or Server Actions yet.

Next.js is chosen for build tooling, deployment ergonomics, and future server capabilities — not because the POC requires SSR today.

## Consequences

### Positive

- Standard, well-documented stack with strong Vercel integration
- App Router allows incremental adoption of server features later without a framework migration
- Built-in TypeScript, ESLint, and font optimization
- Single deployable unit — no monorepo overhead for a POC

### Negative

- Framework bundle overhead for what is effectively a client SPA
- Client-side data means pages prerender only a skeleton; content appears after hydration

## Alternatives considered

### Vite + React SPA

Lighter for a pure client app. Rejected because Next.js was the project scaffold and provides a clearer upgrade path if server-side persistence or auth is added later.

### Pages Router (`pages/`)

Legacy Next.js routing. Rejected — App Router is the current default and where new Next.js features land.

### Monorepo (Turborepo / Nx)

Separate `apps/web` and `packages/shared`. Rejected — one app, one feature; monorepo structure adds cost without benefit at this scale.
