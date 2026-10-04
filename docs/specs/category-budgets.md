# Spec: Category budgets

## Objective

A personal Spanish EUR tracker. The user sets one monthly budget per category and sees how close spending is, without the app blocking or changing how an expense is saved.

Two surfaces:

1. **Form hint.** While registering, the selected category shows spent against its budget for the month of the date in the form. The amount being typed is included.
2. **Month status.** Each month header, next to Exportar and the month total, shows one icon for that month's budget state. Opening it lists each budgeted category for that month.

Success: the user can set a budget, see the hint update before saving, and read the same status from the month header. Saving, editing, and deleting expenses stay as they are today.

## Assumptions

1. One budget number per category, reused for every month. Nothing is stored per month. A month's progress is the sum of that month's saved expenses in that category.
2. The month icon color is the **worst** status among categories that have a budget. Opening the icon shows the per-category rows. The icon is the entry point; the rows are the summary.
3. The month status uses every expense in that month. The category filter does not change it.
4. Categories with no budget are left out of both surfaces.
5. Clearing all expenses does not clear budgets or categories.
6. UI copy stays hardcoded in Spanish. Amounts use the existing `es-ES` / EUR formatter.

## Behavior

### Budget value

- Stored per category name, in euros, as a number greater than 0.
- Empty, zero, or a non-numeric value means no budget.
- Persistence key: `daily-expenses-budgets-es`.
- Shape: `{ "Restaurantes": 200, "Taxi": 80 }`.
- Load and save the same way as categories: read on mount, write after hydration.
- Invalid JSON loads as an empty map.

### Status

Given `spent` and `budget` (budget > 0):

| Ratio | Status | Color |
| --- | --- | --- |
| `< 0.8` | dentro del presupuesto | green |
| `>= 0.8` and `< 1` | cerca del límite | orange |
| `>= 1` | presupuesto superado | red |

The bar fill is `min(spent / budget, 1)`. At or over 100% the bar stays full and the text shows the real spent amount (`240,00 € de 200,00 €`).

Month status is the worst row in that month: red if any row is red, otherwise orange if any row is orange, otherwise green. A budgeted category with no spending that month is a green row at `0,00 €`.

Expenses with an empty category, or a date that does not parse (`Sin fecha`), do not count.

### Form hint

Shown only when a category is selected, between the category control and `Añadir gasto`.

- Label: `Presupuesto mensual`.
- Number input, in euros. It reads and writes that category's budget.
- If the category has a budget, show one line and a thin bar: `{gastado} de {presupuesto}`.
- `gastado` is saved expenses in that category for the **month of the date in the form**, plus the current Importe when it is a valid number. The preview is not saved until `Añadir gasto`.
- If there is no budget, the line and the bar stay hidden. The input stays.
- `Añadir gasto` always works as it does today.

### Month icon

In the month header cluster, before Exportar and the month total.

- Render only when at least one category has a budget.
- A button with a wallet icon. Color matches the month status.
- `aria-label`: `Presupuesto de {mes}: {estado}` (for example `Presupuesto de octubre 2026: cerca del límite`).
- `aria-expanded` reflects whether the list is open.
- Activating the button toggles a list under the month header and above that month's expenses.
- Each row: category name, `{gastado} de {presupuesto}`, and the same thin bar and colors.
- Only categories with a budget. Fullest ratio first. Equal ratios keep category name order (`es`).
- The list counts saved expenses only.

## Tech stack

- Next.js 16.1.6, React 19, TypeScript
- Tailwind CSS v4
- `lucide-react` for the icon (`Wallet`)
- Client-only `localStorage` (ADR-0001)
- No new dependencies

## Commands

```bash
npm run dev
npm run lint
npm run build
```

There is no test script.

## Project structure

```
app/page.tsx                 → form hint, month icon, list UI, localStorage wiring
lib/category-budget.ts       → budget map, spent totals, status, month aggregation
docs/specs/category-budgets.md
```

UI stays in `app/page.tsx` (ADR-0008). Budget rules go in `lib/`, same split as `lib/export-month-csv.ts`. Do not extract types, storage, or hooks in this change.

## Code style

Spanish strings inline. Pure rules stay free of React. Match existing naming: Spanish domain words in the UI, English identifiers in code.

```typescript
export type BudgetStatus = "ok" | "warning" | "over";

export function budgetStatus(spent: number, budget: number): BudgetStatus {
  const ratio = spent / budget;
  if (ratio >= 1) return "over";
  if (ratio >= 0.8) return "warning";
  return "ok";
}
```

Status colors: `text-green-600` / `bg-green-600`, `text-orange-500` / `bg-orange-500`, `text-red-600` / `bg-red-600`. The bar track is `bg-gray-100`.

## Testing strategy

No test runner in the repo. Do not add one for this feature.

- `npm run lint` and `npm run build` must pass.
- Check the form and a month header in the browser: set a budget, type an amount, cross 80% and 100%, save, delete, and confirm the icon and the list follow the saved totals.

## Boundaries

- Always: Spanish copy, EUR via the existing formatter, hint only (saving unchanged), one budget per category.
- Ask first: new dependencies, a test runner, category rename/delete, per-month budget storage, changing the expense shape.
- Never: block `Añadir gasto` because of a budget, persist the unsaved Importe inside the month totals, reset budgets when expenses are cleared.

## Success criteria

- [ ] Selecting a category shows `Presupuesto mensual`. A value greater than 0 persists for that category after reload.
- [ ] With a budget set, the form shows `{gastado} de {presupuesto}` and a bar. The typed Importe is included. The date field's month decides which saved expenses count.
- [ ] Under 80% is green, from 80% up to 100% is orange, 100% or more is red. Over budget, the bar stays full and the text shows the real total.
- [ ] No category, or no budget, hides the form line and bar. Saving still works.
- [ ] Each visible month, when any budget exists, shows a wallet icon beside Exportar and the total. Its color is the worst category status in that month.
- [ ] Activating the icon toggles the per-category rows for that month. Rows use saved expenses only, fullest first.
- [ ] A category filter does not change the icon or the rows.
- [ ] `Borrar todos los datos` leaves budgets in place.

## Open questions

None. The icon's color is the worst category in that month, and activating it reveals the per-category rows.
