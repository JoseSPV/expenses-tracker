import { currentMonth, dayOfMonth, daysInMonth, today } from "./dates";
import { spendingByCategory } from "./selectors";
import type { AppData, MonthKey } from "./types";

export type BudgetStatus = "ok" | "warning" | "over";

export interface BudgetRow {
  categoryId: string;
  limit: number;
  spent: number;
  remaining: number;
  ratio: number;
  status: BudgetStatus;
}

/** Exactly at the limit is still "warning": fixed costs like rent usually land on 100 %. */
export function budgetStatus(ratio: number): BudgetStatus {
  if (ratio > 1) return "over";
  if (ratio >= 0.8) return "warning";
  return "ok";
}

/** Budgeted categories for `month`, fullest first. */
export function budgetRows(data: AppData, month: MonthKey): BudgetRow[] {
  const spentByCategory = new Map(spendingByCategory(data, month).map((s) => [s.categoryId, s.amount]));
  return Object.entries(data.budgets)
    .map(([categoryId, limit]) => {
      const spent = spentByCategory.get(categoryId) ?? 0;
      const ratio = limit > 0 ? spent / limit : 0;
      return { categoryId, limit, spent, remaining: limit - spent, ratio, status: budgetStatus(ratio) };
    })
    .sort((a, b) => b.ratio - a.ratio);
}

/** Fraction of `month` elapsed: 1 for past months, 0 for future ones. */
export function monthPace(month: MonthKey): number {
  const current = currentMonth();
  if (month < current) return 1;
  if (month > current) return 0;
  return dayOfMonth(today()) / daysInMonth(month);
}

/** Days left in the current month, including today; `null` for any other month. */
export function daysLeftInMonth(month: MonthKey): number | null {
  if (month !== currentMonth()) return null;
  return daysInMonth(month) - dayOfMonth(today()) + 1;
}
