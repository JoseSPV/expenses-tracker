---
tags: [expenses-tracker, ui]
title: "ADR-0013: Design tokens, theming and UI primitives"
status: accepted
date: 2026-11-14
supersedes: ADR-0007
---

# ADR-0013: Design tokens, theming and UI primitives

## Status

accepted — supersedes [ADR-0007](./0007-minimal-ui-primitives.md)

## Context

The app now matches a prototype design with light and dark themes, dashboards, charts, and many dialogs. ADR-0007 used raw `gray-*` utilities, custom dropdowns without keyboard support, and no Dialog primitive.

## Decision

Keep the hand-rolled, dependency-free approach, built on semantic tokens.

- **Tokens** — `app/globals.css` defines CSS variables for light and dark (`bg`, `surface`, `surface-2`, `border`, `fg`, `muted`, `primary`, `primary-fg`, `success`, `warning`, `danger`, `shadow-card`) and exposes them to Tailwind v4 with `@theme inline`. Components use `bg-surface`, `text-muted`, and so on, never raw palette colors.
- **Theme** — `data-theme="light" | "dark"` on `<html>`. An inline script in the layout applies the stored choice (or the system preference) before paint, so there's no flash of the wrong theme. `@custom-variant dark` maps Tailwind's `dark:` to the attribute. Stored under `expenses-tracker:theme`.
- **Primitives** in `components/ui/`:
  - `Button` with primary, outline, ghost, and danger variants.
  - `Card`, `Input`, `Select`, `Field`.
  - `Dialog`, built on native `<dialog>` with `showModal()`. It gets focus trapping, Esc, and backdrop from the browser. Children mount only while open, so forms reset. The field to focus is marked with `data-autofocus`.
  - `DialogForm`, `ConfirmButton` (two-step destructive confirm), `Progress`, `Kpi`, `Badge`, `EmptyState`, `Legend`, `Toast`.
- **Native controls** — `<select>` instead of custom dropdowns, for keyboard and screen-reader support.
- **Charts** are plain SVG components measured to their container (`ResizeObserver`), so text and strokes stay at real pixel sizes at any width.
- **Category colors** are user data (hex). They're applied with inline styles; everything else uses tokens.

## Consequences

### Positive

- One place to change the look; dark mode needs no per-component work.
- No UI dependency besides `lucide-react` for icons.
- Native dialog and select are accessible by default.

### Negative

- Native `<select>` can't be styled as freely as a custom listbox.
- Hand-written charts cover only bar, line, and donut. Anything richer needs a library.

## Alternatives considered

### shadcn/ui + Radix

Polished, accessible primitives. Rejected for now — native `<dialog>` and `<select>` cover current needs with no dependency. Still the natural next step if combobox or menu patterns appear.

### Chart library (Recharts, visx)

Rejected — three simple chart types don't justify the bundle.

## When to revisit

When the UI needs comboboxes, menus, date pickers, or interactive charts.
