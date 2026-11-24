import { canonicalizeDate, currentMonth, isISODate, nextDueDate, today } from "@/lib/domain/dates";
import { roundMoney } from "@/lib/domain/money";
import { nextPaletteColor } from "@/lib/domain/palette";
import { hasOversold } from "@/lib/domain/portfolio";
import { categoryUsage, netWorthTotals, portfolioValue } from "@/lib/domain/selectors";
import { isNameTaken, tickerKey } from "@/lib/domain/text";
import type {
  Account,
  AppData,
  Category,
  CategoryType,
  Goal,
  ISODate,
  Instrument,
  InstrumentPrice,
  InvestmentTransaction,
  RecurringItem,
  Transaction,
} from "@/lib/domain/types";
import type { SeedText } from "@/i18n/types";
import { deleteVersioned, saveVersioned } from "@/lib/books/investments";
import { importTrialData, type TrialImportResult } from "@/lib/books/trial-import";
import { saveTransaction as saveMovement } from "@/lib/books/transactions";
import { peekData, readTrialDocument, replaceData, updateData } from "./app-store";
import { emptyAppData } from "./document-for-visit";
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

// Transactions

export type TransactionInput = Omit<Transaction, "id">;

export const saveTransaction = (input: TransactionInput, id?: string, expectedVersion?: number): boolean =>
  updateData((d) => {
    const date = cleanDate(input.date);
    const amount = roundMoney(input.amount);
    if (!date || !Number.isFinite(amount) || amount <= 0 || !hasCategory(d, input.categoryId)) return false;
    const note = input.note.trim();
    if (!id) {
      d.transactions.push({ id: newId(), amount, categoryId: input.categoryId, date, note, version: 1 });
      return;
    }
    const result = saveMovement(d.transactions, { id, amount, categoryId: input.categoryId, date, note, expectedVersion: expectedVersion ?? 1 });
    if (!result.ok) return false;
    d.transactions = result.movements;
  });

export const deleteTransaction = (id: string) =>
  updateData((d) => {
    d.transactions = remove(d.transactions, id);
  });

export const clearAllData = () => replaceData(emptyAppData());

// Categories

export type CategoryInput = Omit<Category, "id">;

export const saveCategory = (input: CategoryInput, id?: string): boolean =>
  updateData((d) => {
    const name = input.name.trim();
    if (!name || isNameTaken(d.categories, name, id)) return false;
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
  const { assets, liabilities } = netWorthTotals(d.accounts, portfolioValue(d));
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

// Investments

/** `oversold`: a sale would be left without shares. `conflict`: someone saved a newer version first. */
export type InvestmentSaveResult = "saved" | "invalid" | "duplicate" | "oversold" | "conflict";

export type InstrumentInput = Pick<Instrument, "ticker" | "name" | "currency">;

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type InvestmentOperationInput = DistributiveOmit<InvestmentTransaction, "id" | "version">;

const isAmount = (value: number) => Number.isFinite(value) && value >= 0;
const isPositive = (value: number) => Number.isFinite(value) && value > 0;

/** Runs a write that can fail for a reason the view needs to tell apart. */
function investmentWrite(recipe: (d: AppData) => InvestmentSaveResult): InvestmentSaveResult {
  let result: InvestmentSaveResult = "invalid";
  updateData((d) => {
    result = recipe(d);
    if (result !== "saved") return false;
    recordSnapshot(d);
  });
  return result;
}

export const saveInstrument = (input: InstrumentInput, id?: string, expectedVersion = 1): InvestmentSaveResult =>
  investmentWrite((d) => {
    const ticker = tickerKey(input.ticker);
    const name = input.name.trim();
    const currency = input.currency.trim().toUpperCase();
    if (!ticker || !name || !/^[A-Z]{3}$/.test(currency)) return "invalid";
    if (d.instruments.some((instrument) => instrument.id !== id && tickerKey(instrument.ticker) === ticker)) return "duplicate";
    if (!id) {
      const color = nextPaletteColor(d.instruments.map((instrument) => instrument.color));
      d.instruments.push({ id: newId(), ticker, name, currency, color, version: 1 });
      return "saved";
    }
    const existing = d.instruments.find((instrument) => instrument.id === id);
    if (!existing) return "invalid";
    // The stored original amounts are in this currency; changing it would misread every one of them.
    const used = d.investmentTransactions.some((op) => op.instrumentId === id);
    const result = saveVersioned(d.instruments, { ...existing, ticker, name, currency: used ? existing.currency : currency }, expectedVersion);
    if (!result.ok) return "missing" in result ? "invalid" : "conflict";
    d.instruments = result.items;
    return "saved";
  });

export const setInstrumentPrice = (id: string, price: InstrumentPrice, expectedVersion = 1): InvestmentSaveResult =>
  investmentWrite((d) => {
    const existing = d.instruments.find((instrument) => instrument.id === id);
    const date = cleanDate(price.date);
    const eurRate = existing?.currency === "EUR" ? 1 : price.eurRate;
    if (!existing || !date || !isPositive(price.value) || !isPositive(eurRate)) return "invalid";
    const result = saveVersioned(d.instruments, { ...existing, price: { value: price.value, eurRate, date } }, expectedVersion);
    if (!result.ok) return "missing" in result ? "invalid" : "conflict";
    d.instruments = result.items;
    return "saved";
  });

/** Also deletes the instrument's operations. */
export const deleteInstrument = (id: string, expectedVersion = 1): InvestmentSaveResult =>
  investmentWrite((d) => {
    const result = deleteVersioned(d.instruments, id, expectedVersion);
    if (!result.ok) return "conflict";
    d.instruments = result.items;
    d.investmentTransactions = d.investmentTransactions.filter((op) => op.instrumentId !== id);
    return "saved";
  });

const roundEur = <T extends Record<string, number>>(eur: T): T =>
  Object.fromEntries(Object.entries(eur).map(([key, value]) => [key, roundMoney(value)])) as T;

function cleanOperation(input: InvestmentOperationInput, instrument: Instrument): InvestmentOperationInput | null {
  const date = cleanDate(input.date);
  const eurRate = instrument.currency === "EUR" ? 1 : input.eurRate;
  const feeCurrencyOk = input.fee.currency === "EUR" || input.fee.currency === instrument.currency;
  if (!date || !isPositive(eurRate) || !isAmount(input.fee.amount) || !feeCurrencyOk) return null;
  if (!Object.values(input.eur).every(isAmount)) return null;
  const common = { instrumentId: instrument.id, date, eurRate, fee: { ...input.fee }, note: input.note.trim() };
  if (input.type === "dividend") {
    if (!isPositive(input.gross) || !isAmount(input.withholdingOrigin) || input.withholdingOrigin > input.gross) return null;
    return { ...common, type: "dividend", gross: input.gross, withholdingOrigin: input.withholdingOrigin, eur: roundEur(input.eur) };
  }
  if (!isPositive(input.quantity) || !isPositive(input.unitPrice) || !isPositive(input.eur.gross)) return null;
  return { ...common, type: input.type, quantity: input.quantity, unitPrice: input.unitPrice, eur: roundEur(input.eur) };
}

export const saveInvestmentOperation = (input: InvestmentOperationInput, id?: string, expectedVersion = 1): InvestmentSaveResult =>
  investmentWrite((d) => {
    const existing = id ? d.investmentTransactions.find((op) => op.id === id) : undefined;
    // An operation stays with its instrument; moving it would replay two FIFO histories at once.
    const instrumentId = existing?.instrumentId ?? input.instrumentId;
    const instrument = d.instruments.find((item) => item.id === instrumentId);
    const operation = instrument ? cleanOperation({ ...input, instrumentId }, instrument) : null;
    if (!operation || (id && !existing)) return "invalid";
    if (!id) {
      d.investmentTransactions.push({ ...operation, id: newId(), version: 1 } as InvestmentTransaction);
    } else {
      const result = saveVersioned(d.investmentTransactions, { ...operation, id } as InvestmentTransaction, expectedVersion);
      if (!result.ok) return "missing" in result ? "invalid" : "conflict";
      d.investmentTransactions = result.items;
    }
    return hasOversold(d.investmentTransactions, instrumentId) ? "oversold" : "saved";
  });

export const deleteInvestmentOperation = (id: string, expectedVersion = 1): InvestmentSaveResult =>
  investmentWrite((d) => {
    const existing = d.investmentTransactions.find((op) => op.id === id);
    const result = deleteVersioned(d.investmentTransactions, id, expectedVersion);
    if (!result.ok) return "conflict";
    d.investmentTransactions = result.items;
    return existing && hasOversold(d.investmentTransactions, existing.instrumentId) ? "oversold" : "saved";
  });

// Whole dataset

export const loadDemoData = (seed: SeedText) => replaceData(createSeedData(seed));

/** Copies this browser's trial into the signed-in account in one write. */
export function importTrial(): TrialImportResult["result"] {
  const current = peekData();
  if (!current) return "nothing";
  const outcome = importTrialData(current, readTrialDocument());
  if (outcome.result === "imported") replaceData(outcome.data);
  return outcome.result;
}
