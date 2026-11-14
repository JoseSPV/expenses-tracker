import { currentMonth, nextDueDate, today } from "@/lib/domain/dates";
import { categoryUsage, netWorthTotals } from "@/lib/domain/selectors";
import type { Account, AppData, Category, Goal, RecurringItem, Transaction } from "@/lib/domain/types";
import type { SeedText } from "@/i18n/types";
import { replaceData, updateData } from "./app-store";
import { createSeedData } from "./seed";

const newId = () => crypto.randomUUID();

function upsert<T extends { id: string }>(list: T[], input: Omit<T, "id">, id?: string): void {
  const existing = id ? list.find((item) => item.id === id) : undefined;
  if (existing) Object.assign(existing, input);
  else list.push({ id: newId(), ...input } as T);
}

const remove = <T extends { id: string }>(list: T[], id: string): T[] => list.filter((item) => item.id !== id);

// Transactions

export type TransactionInput = Omit<Transaction, "id">;

export const saveTransaction = (input: TransactionInput, id?: string) =>
  updateData((d) => upsert(d.transactions, input, id));

export const deleteTransaction = (id: string) =>
  updateData((d) => {
    d.transactions = remove(d.transactions, id);
  });

export const clearTransactions = () =>
  updateData((d) => {
    d.transactions = [];
  });

// Categories

export type CategoryInput = Omit<Category, "id">;

export const saveCategory = (input: CategoryInput, id?: string) =>
  updateData((d) => {
    const existing = id ? d.categories.find((c) => c.id === id) : undefined;
    const usage = existing ? categoryUsage(d, existing.id) : null;
    // Changing type would silently flip its transactions between income and expense.
    const type = existing && usage && usage.transactions + usage.recurring > 0 ? existing.type : input.type;
    upsert(d.categories, { ...input, type }, id);
    if (existing && type === "income") delete d.budgets[existing.id];
  });

/** Moves transactions and recurring items to `reassignTo` before removing the category. */
export const deleteCategory = (id: string, reassignTo?: string) =>
  updateData((d) => {
    const usage = categoryUsage(d, id);
    if (usage.transactions + usage.recurring > 0) {
      if (!reassignTo || !d.categories.some((c) => c.id === reassignTo)) {
        throw new Error("A category in use needs a target category");
      }
      d.transactions.forEach((t) => t.categoryId === id && (t.categoryId = reassignTo));
      d.recurring.forEach((r) => r.categoryId === id && (r.categoryId = reassignTo));
    }
    d.categories = remove(d.categories, id);
    delete d.budgets[id];
  });

// Budgets

export const setBudget = (categoryId: string, limit: number) =>
  updateData((d) => {
    d.budgets[categoryId] = limit;
  });

export const deleteBudget = (categoryId: string) =>
  updateData((d) => {
    delete d.budgets[categoryId];
  });

// Goals

export type GoalInput = Omit<Goal, "id">;

export const saveGoal = (input: GoalInput, id?: string) => updateData((d) => upsert(d.goals, input, id));

export const deleteGoal = (id: string) =>
  updateData((d) => {
    d.goals = remove(d.goals, id);
  });

/** Negative amounts withdraw; the balance never drops below zero. */
export const contributeToGoal = (id: string, amount: number) =>
  updateData((d) => {
    const goal = d.goals.find((g) => g.id === id);
    if (goal) goal.saved = Math.max(0, goal.saved + amount);
  });

// Recurring items

export type RecurringInput = Omit<RecurringItem, "id">;

export const saveRecurring = (input: RecurringInput, id?: string) =>
  updateData((d) => upsert(d.recurring, input, id));

export const deleteRecurring = (id: string) =>
  updateData((d) => {
    d.recurring = remove(d.recurring, id);
  });

/** Records the payment as a transaction and moves the item to its next due date. */
export function logRecurringPayment(id: string): RecurringItem | undefined {
  let updated: RecurringItem | undefined;
  updateData((d) => {
    const item = d.recurring.find((r) => r.id === id);
    if (!item) return;
    const now = today();
    d.transactions.push({
      id: newId(),
      amount: item.amount,
      categoryId: item.categoryId,
      date: item.nextDate <= now ? item.nextDate : now,
      note: item.name,
    });
    item.nextDate = nextDueDate(item.nextDate, item.frequency);
    updated = { ...item };
  });
  return updated;
}

// Net worth

export type AccountInput = Omit<Account, "id">;

/** Keeps the current month's snapshot in sync so history survives month rollover. */
function recordSnapshot(d: AppData): void {
  const month = currentMonth();
  const { assets, liabilities } = netWorthTotals(d.accounts);
  d.netWorthHistory = [...d.netWorthHistory.filter((s) => s.month !== month), { month, assets, liabilities }];
}

export const saveAccount = (input: AccountInput, id?: string) =>
  updateData((d) => {
    upsert(d.accounts, input, id);
    recordSnapshot(d);
  });

export const deleteAccount = (id: string) =>
  updateData((d) => {
    d.accounts = remove(d.accounts, id);
    recordSnapshot(d);
  });

// Whole dataset

export const loadDemoData = (seed: SeedText) => replaceData(createSeedData(seed));
