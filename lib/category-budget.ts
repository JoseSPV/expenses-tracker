export type BudgetStatus = "ok" | "warning" | "over";

export type CategoryBudgets = Record<string, number>;

export interface BudgetExpense {
  amount: number;
  category: string;
  monthKey: string;
}

export interface BudgetRow {
  category: string;
  spent: number;
  budget: number;
  status: BudgetStatus;
}

const STATUS_RANK: Record<BudgetStatus, number> = {
  ok: 0,
  warning: 1,
  over: 2,
};

export function budgetStatus(spent: number, budget: number): BudgetStatus {
  const ratio = spent / budget;
  if (ratio >= 1) return "over";
  if (ratio >= 0.8) return "warning";
  return "ok";
}

export function parseBudgets(value: unknown): CategoryBudgets {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  const budgets: CategoryBudgets = {};

  for (const [category, amount] of Object.entries(value)) {
    if (typeof amount === "number" && Number.isFinite(amount) && amount > 0) {
      budgets[category] = amount;
    }
  }

  return budgets;
}

export function budgetFromInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) return null;

  return value;
}

export function spentInMonth(
  expenses: BudgetExpense[],
  monthKey: string,
  category: string,
): number {
  if (monthKey === "unknown" || !category) return 0;

  return expenses.reduce((sum, expense) => {
    if (expense.monthKey !== monthKey || expense.category !== category) {
      return sum;
    }

    return sum + expense.amount;
  }, 0);
}

export function monthBudgetRows(
  expenses: BudgetExpense[],
  monthKey: string,
  budgets: CategoryBudgets,
): BudgetRow[] {
  if (monthKey === "unknown") return [];

  const rows: BudgetRow[] = [];

  for (const [category, budget] of Object.entries(budgets)) {
    if (!(budget > 0)) continue;

    const spent = spentInMonth(expenses, monthKey, category);
    rows.push({
      category,
      spent,
      budget,
      status: budgetStatus(spent, budget),
    });
  }

  return rows.sort((a, b) => {
    const ratioDiff = b.spent / b.budget - a.spent / a.budget;
    if (ratioDiff !== 0) return ratioDiff;
    return a.category.localeCompare(b.category, "es");
  });
}

export function worstBudgetStatus(rows: BudgetRow[]): BudgetStatus | null {
  if (rows.length === 0) return null;

  return rows.reduce<BudgetStatus>((worst, row) => {
    return STATUS_RANK[row.status] > STATUS_RANK[worst] ? row.status : worst;
  }, rows[0].status);
}
