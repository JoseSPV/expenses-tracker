# expenses-tracker

Personal daily expense tracker built with Next.js. Spanish UI, EUR currency, client-side persistence via `localStorage`.

See [docs/adr/](./docs/adr/) for the full ADR index and format reference.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

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

## Deploy on Vercel

The easiest way to deploy this Next.js app is the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

See the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for details.
