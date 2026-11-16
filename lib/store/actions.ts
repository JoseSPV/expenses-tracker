import { canonicalizeDate, currentMonth, isISODate, nextDueDate, today } from "@/lib/domain/dates";
import { roundMoney } from "@/lib/domain/money";
import { categoryUsage, netWorthTotals } from "@/lib/domain/selectors";
import type { Account, AppData, Category, CategoryType, Goal, ISODate, RecurringItem, Transaction } from "@/lib/domain/types";
import type { SeedText } from "@/i18n/types";
import { replaceData, updateData } from "./app-store";
import { createSeedData } from "./seed";

const newId = () => crypto.randomUUID();

/** Ignores a second tap on the same bill before the first payment has settled on screen. */
const PAYMENT_LOCK_MS = 700;
const paymentLockedUntil = new Map<string, number>();

function upsert<T extends { id: string }>(list: T[], input: Omit<T, "id">, id?: string): void {
  const existing = id ? list.find((item) => item.id === id) : undefined;
  if (existing) Object.assign(existing, input);
  else list.push({ id: newId(), ...input } as T);
}

const remove = <T extends { id: string }>(list: T[], id: string): T[] => list.filter((item) => item.id !== id);

function cleanDate(value: string): ISODate | null {
  const date = canonicalizeDate(value);
  return isISODate(date) ? date : null;
}

function hasCategory(data: AppData, id: string, type?: CategoryType): boolean {
  return data.categories.some((category) => category.id === id && (type === undefined || category.type === type));
}

const nameKey = (name: string) => name.trim().toLocaleLowerCase("es");

// Transactions

export type TransactionInput = Omit<Transaction, "id">;

export const saveTransaction = (input: TransactionInput, id?: string): boolean =>
  updateData((d) => {
    const date = cleanDate(input.date);
    const amount = roundMoney(input.amount);
    if (!date || !Number.isFinite(amount) || amount <= 0 || !hasCategory(d, input.categoryId)) return false;
    upsert(d.transactions, { ...input, amount, date, note: input.note.trim() }, id);
  });

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

export const saveCategory = (input: CategoryInput, id?: string): boolean =>
  updateData((d) => {
    const name = input.name.trim();
    const key = nameKey(name);
    if (!key || d.categories.some((category) => category.id !== id && nameKey(category.name) === key)) return false;
    const existing = id ? d.categories.find((category) => category.id === id) : undefined;
    const usage = existing ? categoryUsage(d, existing.id) : null;
    // Changing type would silently flip its transactions between income and expense.
    const type = existing && usage && usage.transactions + usage.recurring > 0 ? existing.type : input.type;
    upsert(d.categories, { ...input, name, type }, id);
    if (existing && type === "income") delete d.budgets[existing.id];
  });

/** Moves transactions and recurring items to `reassignTo` before removing the category. */
export const deleteCategory = (id: string, reassignTo?: string) =>
  updateData((d) => {
    const usage = categoryUsage(d, id);
    if (usage.transactions + usage.recurring > 0) {
      if (!reassignTo || !d.categories.some((category) => category.id === reassignTo && category.id !== id)) {
        throw new Error("A category in use needs a target category");
      }
      d.transactions.forEach((transaction) => transaction.categoryId === id && (transaction.categoryId = reassignTo));
      d.recurring.forEach((item) => item.categoryId === id && (item.categoryId = reassignTo));
    }
    d.categories = remove(d.categories, id);
    delete d.budgets[id];
  });

// Budgets

export const setBudget = (categoryId: string, limit: number): boolean =>
  updateData((d) => {
    const amount = roundMoney(limit);
    if (!Number.isFinite(amount) || amount <= 0 || !hasCategory(d, categoryId, "expense")) return false;
    d.budgets[categoryId] = amount;
  });

export const deleteBudget = (categoryId: string) =>
  updateData((d) => {
    delete d.budgets[categoryId];
  });

// Goals

export type GoalInput = Omit<Goal, "id">;

export const saveGoal = (input: GoalInput, id?: string): boolean =>
  updateData((d) => {
    const name = input.name.trim();
    const deadline = cleanDate(input.deadline);
    const target = roundMoney(input.target);
    const saved = roundMoney(input.saved);
    if (!name || !deadline || !Number.isFinite(target) || target <= 0 || !Number.isFinite(saved) || saved < 0) return false;
    upsert(d.goals, { ...input, name, deadline, target, saved }, id);
  });

export const deleteGoal = (id: string) =>
  updateData((d) => {
    d.goals = remove(d.goals, id);
  });

/** Negative amounts withdraw. Returns the amount actually applied; the balance never drops below zero. */
export const contributeToGoal = (id: string, amount: number): number => {
  const value = roundMoney(amount);
  if (!Number.isFinite(value) || value === 0) return 0;
  let applied = 0;
  updateData((d) => {
    const goal = d.goals.find((item) => item.id === id);
    if (!goal) return false;
    const next = roundMoney(Math.max(0, goal.saved + value));
    applied = roundMoney(next - goal.saved);
    if (applied === 0) return false;
    goal.saved = next;
  });
  return applied;
};

// Recurring items

export type RecurringInput = Omit<RecurringItem, "id">;

export const saveRecurring = (input: RecurringInput, id?: string): boolean =>
  updateData((d) => {
    const name = input.name.trim();
    const nextDate = cleanDate(input.nextDate);
    const amount = roundMoney(input.amount);
    if (!name || !nextDate || !Number.isFinite(amount) || amount <= 0 || !hasCategory(d, input.categoryId)) return false;
    upsert(d.recurring, { ...input, name, amount, nextDate }, id);
  });

export const deleteRecurring = (id: string) =>
  updateData((d) => {
    d.recurring = remove(d.recurring, id);
  });

/** Records the payment as a transaction and moves the item to its next due date. */
export function logRecurringPayment(id: string): RecurringItem | undefined {
  if ((paymentLockedUntil.get(id) ?? 0) > Date.now()) return undefined;
  let updated: RecurringItem | undefined;
  const saved = updateData((d) => {
    const item = d.recurring.find((entry) => entry.id === id);
    if (!item || !isISODate(item.nextDate)) return false;
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
  if (!saved) return undefined;
  paymentLockedUntil.set(id, Date.now() + PAYMENT_LOCK_MS);
  return updated;
}

// Net worth

export type AccountInput = Omit<Account, "id">;

/** Keeps the current month's snapshot in sync so history survives month rollover. */
function recordSnapshot(d: AppData): void {
  const month = currentMonth();
  const { assets, liabilities } = netWorthTotals(d.accounts);
  d.netWorthHistory = [...d.netWorthHistory.filter((snapshot) => snapshot.month !== month), { month, assets, liabilities }];
}

export const saveAccount = (input: AccountInput, id?: string): boolean =>
  updateData((d) => {
    const name = input.name.trim();
    const balance = roundMoney(input.balance);
    if (!name || !Number.isFinite(balance) || balance < 0) return false;
    upsert(d.accounts, { ...input, name, balance }, id);
    recordSnapshot(d);
  });

export const deleteAccount = (id: string) =>
  updateData((d) => {
    d.accounts = remove(d.accounts, id);
    recordSnapshot(d);
  });

// Whole dataset

export const loadDemoData = (seed: SeedText) => replaceData(createSeedData(seed));
