import { addDays, addMonths, currentMonth, today } from "./dates";
import { portfolioSummary } from "./portfolio";
import { sum } from "./sum";
import type { Account, AppData, Category, CategoryType, MonthKey, RecurringItem, Transaction } from "./types";

const UNCATEGORIZED_COLOR = "#94a3b8";

const indexCache = new WeakMap<Category[], Map<string, Category>>();

function categoryIndex(categories: Category[]): Map<string, Category> {
  let index = indexCache.get(categories);
  if (!index) {
    index = new Map(categories.map((c) => [c.id, c]));
    indexCache.set(categories, index);
  }
  return index;
}

export const findCategory = (data: AppData, id: string): Category | undefined =>
  categoryIndex(data.categories).get(id);

/** Falls back to a neutral placeholder so views never crash on a dangling id. */
export const categoryOrPlaceholder = (data: AppData, id: string, placeholderName: string): Category =>
  findCategory(data, id) ?? { id, name: placeholderName, color: UNCATEGORIZED_COLOR, type: "expense" };

export const typeOf = (data: AppData, item: Pick<Transaction | RecurringItem, "categoryId">): CategoryType =>
  findCategory(data, item.categoryId)?.type ?? "expense";

export const categoriesOfType = (data: AppData, type: CategoryType): Category[] =>
  data.categories.filter((c) => c.type === type);

export const transactionsInMonth = (data: AppData, month: MonthKey): Transaction[] =>
  data.transactions.filter((t) => t.date.startsWith(month));

export function totals(data: AppData, transactions: Transaction[]) {
  const income = sum(transactions.filter((t) => typeOf(data, t) === "income"), (t) => t.amount);
  const expense = sum(transactions.filter((t) => typeOf(data, t) === "expense"), (t) => t.amount);
  const net = income - expense;
  return { income, expense, net, savingsRate: income > 0 ? net / income : 0 };
}

export interface CategoryAmount {
  categoryId: string;
  amount: number;
}

export function spendingByCategory(data: AppData, month: MonthKey): CategoryAmount[] {
  const amounts = new Map<string, number>();
  for (const t of transactionsInMonth(data, month)) {
    if (typeOf(data, t) === "expense") amounts.set(t.categoryId, (amounts.get(t.categoryId) ?? 0) + t.amount);
  }
  return [...amounts]
    .map(([categoryId, amount]) => ({ categoryId, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function monthlyTrend(data: AppData, endMonth: MonthKey, count = 6) {
  return Array.from({ length: count }, (_, i) => {
    const month = addMonths(endMonth, i - count + 1);
    return { month, ...totals(data, transactionsInMonth(data, month)) };
  });
}

export function upcomingRecurring(data: AppData, days = 30): RecurringItem[] {
  const limit = addDays(today(), days);
  return data.recurring
    .filter((r) => r.nextDate <= limit)
    .sort((a, b) => a.nextDate.localeCompare(b.nextDate));
}

/** Market value of the open positions; a position without a price counts at cost. */
export const portfolioValue = (data: Pick<AppData, "instruments" | "investmentTransactions">): number =>
  portfolioSummary(data.instruments, data.investmentTransactions).valueEur;

/** `portfolio` is a computed asset, not an editable account. */
export function netWorthTotals(accounts: Account[], portfolio = 0) {
  const assets = sum(accounts.filter((a) => a.kind === "asset"), (a) => a.balance) + portfolio;
  const liabilities = sum(accounts.filter((a) => a.kind === "liability"), (a) => a.balance);
  return { assets, liabilities, net: assets - liabilities };
}

/**
 * Average expenses over the last `months` complete months.
 * When those months have no spending, falls back to the current month so a new
 * ledger doesn't preload the emergency fund with 0.
 */
export function averageMonthlyExpenses(data: AppData, months = 3): number {
  const month = currentMonth();
  const past = Array.from({ length: months }, (_, i) => totals(data, transactionsInMonth(data, addMonths(month, -(i + 1)))).expense);
  const total = sum(past, (expense) => expense);
  if (total > 0) return total / months;
  return totals(data, transactionsInMonth(data, month)).expense;
}

export function categoryUsage(data: AppData, categoryId: string) {
  return {
    transactions: data.transactions.filter((t) => t.categoryId === categoryId).length,
    recurring: data.recurring.filter((r) => r.categoryId === categoryId).length,
  };
}
