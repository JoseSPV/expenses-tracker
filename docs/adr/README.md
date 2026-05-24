# Architecture Decision Records

This folder holds ADRs for **expenses-tracker** — short documents that capture a single architectural decision: what was decided, why, and what alternatives were considered.

ADRs document **intent**, not just current code. When code and intent diverge (e.g. a migration is in progress), the ADR is the source of truth for direction.

Inspired by [Giving Claude architectural memory](https://www.nbaglivo.dev/writing/giving-claude-architectural-memory).

## Format

Each ADR is a markdown file with YAML frontmatter:

```yaml
---
tags: [expenses-tracker, domain]
title: "ADR-0004: Fixed expense categories"
status: accepted
date: 2026-05-24
---
```

### Tags

| Tag | Scope |
|-----|--------|
| `expenses-tracker` | Service-wide — load all ADRs with this tag for full context |
| `persistence` | Storage, sync, offline |
| `framework` | Next.js, React, tooling |
| `auth` | Users, sessions, identity |
| `domain` | Expense model, categories, business rules |
| `i18n` | Locale, currency, copy |
| `ui` | Components, styling, design system |
| `architecture` | App structure, layering, boundaries |

Filter by domain when a task is scoped (e.g. only `auth` ADRs for login work).

### Status values

| Status | Meaning |
|--------|---------|
| `accepted` | Decision is in effect |
| `proposed` | Under discussion, not yet adopted |
| `deprecated` | Superseded — see the replacing ADR |
| `superseded` | Replaced by another ADR (link it in the body) |

## Index

| ADR | Title | Status | Tags |
|-----|-------|--------|------|
| [0001](./0001-client-only-local-storage.md) | Client-only local-first persistence | accepted | persistence, architecture |
| [0002](./0002-nextjs-app-router.md) | Next.js App Router as application shell | accepted | framework, architecture |
| [0003](./0003-no-authentication.md) | No authentication for POC | accepted | auth |
| [0004](./0004-fixed-expense-categories.md) | Fixed expense category taxonomy | superseded | domain |
| [0005](./0005-expense-domain-model.md) | Expense entity shape | accepted | domain, persistence |
| [0006](./0006-spanish-locale-and-eur.md) | Spanish locale and EUR currency | accepted | i18n, domain |
| [0007](./0007-minimal-ui-primitives.md) | Minimal shadcn-style UI primitives | accepted | ui |
| [0008](./0008-monolithic-page-for-poc.md) | Monolithic page component for POC scope | accepted | architecture |
| [0009](./0009-user-defined-categories.md) | User-defined expense categories | accepted | domain, persistence |

## Adding a new ADR

1. Copy [template.md](./template.md) to `NNNN-short-title.md` (next sequential number).
2. Fill in frontmatter and sections.
3. Update this index table.
4. When superseding an ADR, set the old one's status to `superseded` and link both ways.

## Using ADRs with AI

When starting a session, load relevant ADRs as context before touching code. Example prompt framing:

> You have the architectural context for expenses-tracker. I want to implement X — tell me what to build and flag anything that conflicts with existing decisions.

Ask explicitly: *Does this decision contradict anything in the existing ADRs?*
