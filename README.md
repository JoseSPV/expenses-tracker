# expenses-tracker

**Joenance** — a personal finance app built with Next.js. Track daily expenses and income, set monthly budgets per category, save towards goals, follow recurring bills and net worth, and run quick financial calculators.

Spanish UI, EUR currency, no account: all data lives in the browser's `localStorage`.

- **User guide (Spanish):** [docs/user-guide.md](./docs/user-guide.md)
- **Architecture decisions:** [docs/adr/](./docs/adr/)

## Features

| Section | Route | What it does |
| --- | --- | --- |
| Resumen | `/es` | Monthly KPIs, spending by category, 6-month income vs. expenses, budget/bill/goal highlights |
| Movimientos | `/es/transactions` | Add, edit, search and filter transactions; export the month's expense summary as CSV |
| Presupuestos | `/es/budgets` | Monthly limit per category, expected-pace marker, daily allowance |
| Objetivos | `/es/goals` | Savings goals with deadlines, contributions and required monthly saving |
| Recibos | `/es/bills` | Recurring bills and income; "mark paid" logs the transaction and advances the due date |
| Patrimonio | `/es/net-worth` | Assets, liabilities and monthly net-worth history |
| Calculadoras | `/es/calculators` | Compound interest, loan payment, emergency fund |
| Categorías | `/es/categories` | Create, rename, recolor and delete categories (with reassignment) |

Light and dark themes, responsive layout (bottom navigation on mobile).

## Getting started

Requires Node.js 20.9 or later.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). It redirects to `/es`. On first load the app seeds six months of demo data, or migrates data from the previous version if it finds it (see [ADR-0012](./docs/adr/0012-domain-model-v1.md)).

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build; also type-checks |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

There is no test runner yet.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, `lucide-react`. No UI, chart, state or i18n libraries — see [ADR-0013](./docs/adr/0013-design-tokens-and-theming.md).

## Project structure

```
app/[lang]/              → root layout per locale and one thin page per section
features/<section>/      → client views and dialogs for each section
components/ui/           → primitives: Button, Card, Input, Dialog, Progress, Toast…
components/charts/       → SVG bar, line and donut charts
components/layout/       → app shell, navigation, month picker context, theme
lib/domain/              → pure business rules: types, dates, selectors, budgets, finance math
lib/store/               → localStorage store, actions, demo seed, legacy migration
i18n/                    → locale config, dictionaries, formatters, provider
proxy.ts                 → redirects paths without a locale prefix
```

Dependencies flow one way: `app` → `features` → `components` / `lib`. Views read data with `useAppData()` and write through `lib/store/actions.ts`; nothing else touches `localStorage`. Details in [ADR-0011](./docs/adr/0011-feature-modules-and-routes.md).

## Internationalization

Locales use the App Router pattern: a `[lang]` segment, JSON dictionaries and `Intl` formatters, with no library ([ADR-0010](./docs/adr/0010-app-router-i18n.md)). Spanish is the only locale today. To add one:

1. Add the code to `locales` and `formattingLocale` in `i18n/config.ts`.
2. Copy `i18n/dictionaries/es.json` to `<code>.json` and translate it. TypeScript reports missing keys.
3. Load it in `i18n/get-dictionary.ts`.

Never hardcode UI text or call `toLocaleString` in components. Use `dict` and `format` from `useI18n()`.

## Architecture Decision Records

This project uses [Architecture Decision Records (ADRs)](./docs/adr/) to capture **why** the system works the way it does — not just what the code does today. ADRs are the source of architectural intent; when code and intent diverge (e.g. a migration is in progress), the ADR wins.

Inspired by [Giving Claude architectural memory](https://www.nbaglivo.dev/writing/giving-claude-architectural-memory) — Nicolas Baglivo.

### Loading context for an AI session

Before starting work with an AI assistant, load the relevant ADRs as context. You can paste them manually, attach the files, or use a tag-based tool like [`@nbaglivo/ctx`](https://www.npmjs.com/package/@nbaglivo/ctx):

```bash
# Full architectural picture
npx @nbaglivo/ctx --tags expenses-tracker --output .ai-context.md

# Scoped to a domain (e.g. auth work only)
npx @nbaglivo/ctx --tags expenses-tracker --tag auth --output .ai-context.md
```

Then reference the output in your session (e.g. attach `.ai-context.md` or pass it as a system prompt).

Each ADR is tagged in frontmatter — use `expenses-tracker` for service-wide context, or add domain tags (`persistence`, `auth`, `domain`, `ui`, etc.) to narrow scope.

### Prompting patterns

Be explicit about what you want the AI to do with the loaded context:

> You have the architectural context for expenses-tracker. I want to implement X — tell me what to build and flag anything that conflicts with existing decisions.

Useful follow-ups:

- *Does this approach contradict anything in the existing ADRs?*
- *Walk through your plan against the ADRs before writing code.*

The goal is to catch drift **before** implementation, not during review.

### Authoring new ADRs

When working through a new decision with AI:

1. Load existing ADRs so suggestions are constrained by prior decisions.
2. Think through the decision in the session — alternatives, trade-offs, consequences.
3. Ask the AI to draft the ADR; it already has the format from existing records.
4. Commit the new ADR to `docs/adr/` and update the [index](./docs/adr/README.md).

Once an ADR is accepted, implementation follows the decision — the AI's job is to build, not reinvent direction.

## Deploy

Any Next.js host works; [Vercel](https://vercel.com/new) is the simplest. The app has no environment variables or backend. See the [Next.js deployment docs](https://nextjs.org/docs/app/getting-started/deploying).
