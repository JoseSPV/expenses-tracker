---
tags: [expenses-tracker, ui]
title: "ADR-0007: Minimal shadcn-style UI primitives"
status: accepted
date: 2026-05-24
---

# ADR-0007: Minimal shadcn-style UI primitives

## Status

accepted

## Context

The UI needs consistent spacing, typography, and interactive elements without adopting a full component library. The project uses Tailwind CSS v4 and should stay lightweight.

## Decision

Use a **minimal, hand-rolled component set** inspired by [shadcn/ui](https://ui.shadcn.com/) conventions:

| Component | Location | Notes |
|-----------|----------|-------|
| `Button` | `components/ui/button.tsx` | `default` and `outline` variants |
| `Card` / `CardContent` | `components/ui/card.tsx` | Container for form and list sections |
| `Input` | `components/ui/input.tsx` | Text, number, date inputs |
| `cn()` | `lib/utils.ts` | `clsx` + `tailwind-merge` for class composition |

Additional UI:

- **Icons**: `lucide-react` (`Trash2`, `ChevronDown`)
- **Styling**: explicit Tailwind utility classes (`gray-*`, `rounded-2xl`) — dark mode CSS variables exist in `globals.css` but are not used in components
- **Custom dropdowns**: native `<button>` + positioned divs, not Radix/shadcn Select
- **Modal**: inline confirm dialog for "clear all" — no Dialog primitive

There is no `components.json`, no Radix UI dependency, and no full shadcn CLI setup.

## Consequences

### Positive

- Small dependency footprint — no Radix, no full design system
- Full control over markup and styling
- `cn()` pattern is portable if shadcn components are added incrementally later

### Negative

- Custom dropdowns lack built-in accessibility (keyboard nav, ARIA roles) that Radix provides
- Inconsistent patterns if new components are added ad hoc
- No design tokens beyond Tailwind defaults and a few CSS variables

## Alternatives considered

### Full shadcn/ui + Radix

Accessible, polished primitives (Select, Dialog, DropdownMenu). Deferred — POC uses only a handful of patterns; full install adds many dependencies for little immediate use.

### Material UI / Chakra / Mantine

Complete design systems. Rejected — heavy bundle, opinionated styling conflicts with Tailwind-first approach.

### Plain HTML with no abstractions

Fewest files. Rejected — `Button`/`Card`/`Input` already reduce repetition and establish a pattern for growth.

## When to revisit

When adding accessible Select/Dialog components, theming, or enough UI surface to justify shadcn CLI initialization.
