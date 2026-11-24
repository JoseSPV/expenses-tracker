import { canonicalizeDate } from "@/lib/domain/dates";
import { PALETTE } from "@/lib/domain/palette";
import { nameKey } from "@/lib/domain/text";
import type { AppData, Budgets, Category, Transaction } from "@/lib/domain/types";
import type { SeedText } from "@/i18n/types";
import { INCOME_CATEGORY_IDS, seedCategories } from "./seed";

/** Keys and shapes written by the single-page version of the app (ADR-0005, ADR-0009). */
const LEGACY_KEYS = {
  expenses: "daily-expenses-es",
  categories: "daily-expenses-categories-es",
  budgets: "daily-expenses-budgets-es",
};
const LEGACY_EMPTY_DESCRIPTION = "Sin descripción";

interface LegacyExpense {
  id: number;
  amount: number;
  description: string;
  category: string;
  date: string;
}

function readJson(storage: Storage, key: string): unknown {
  try {
    return JSON.parse(storage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}

const isLegacyExpense = (value: unknown): value is LegacyExpense => {
  const e = value as LegacyExpense;
  return typeof e === "object" && e !== null && typeof e.amount === "number" && typeof e.date === "string";
};

/** `d/m/yyyy` (es-ES `toLocaleDateString`) → `yyyy-mm-dd`. A 2-digit year becomes 20xx. */
function legacyDateToISO(value: string): string | null {
  const [day, month, year] = value.split("/").map(Number);
  if (!day || !month || !year) return null;
  return canonicalizeDate(`${year}-${month}-${day}`);
}

export const hasLegacyData = (storage: Storage): boolean =>
  Object.values(LEGACY_KEYS).some((key) => storage.getItem(key) !== null);

/**
 * Converts legacy data into the current model. Legacy keys are left untouched so the
 * previous version keeps working if the user rolls back.
 */
export function migrateLegacyData(storage: Storage, seed: SeedText): AppData {
  const rawExpenses = readJson(storage, LEGACY_KEYS.expenses);
  const expenses = Array.isArray(rawExpenses) ? rawExpenses.filter(isLegacyExpense) : [];
  const rawNames = readJson(storage, LEGACY_KEYS.categories);
  const names = Array.isArray(rawNames) ? rawNames.filter((n): n is string => typeof n === "string") : [];
  const rawBudgets = readJson(storage, LEGACY_KEYS.budgets);

  const byName = new Map<string, Category>();
  const ensureCategory = (name: string): Category => {
    const key = nameKey(name);
    let category = byName.get(key);
    if (!category) {
      category = { id: crypto.randomUUID(), name, color: PALETTE[byName.size % PALETTE.length], type: "expense" };
      byName.set(key, category);
    }
    return category;
  };

  names.map((n) => n.trim()).filter(Boolean).forEach(ensureCategory);

  const transactions: Transaction[] = expenses.flatMap((expense) => {
    const date = legacyDateToISO(expense.date);
    if (!date) return [];
    const categoryName = expense.category?.trim() || seed.categories.uncategorized;
    const description = expense.description?.trim() ?? "";
    return [
      {
        id: String(expense.id),
        amount: expense.amount,
        categoryId: ensureCategory(categoryName).id,
        date,
        note: description === LEGACY_EMPTY_DESCRIPTION ? "" : description,
      },
    ];
  });

  const budgets: Budgets = {};
  if (rawBudgets && typeof rawBudgets === "object" && !Array.isArray(rawBudgets)) {
    for (const [name, limit] of Object.entries(rawBudgets)) {
      if (typeof limit === "number" && limit > 0) budgets[ensureCategory(name).id] = limit;
    }
  }

  return {
    version: 2,
    categories: [...byName.values(), ...seedCategories(seed, INCOME_CATEGORY_IDS)],
    transactions,
    budgets,
    goals: [],
    recurring: [],
    accounts: [],
    netWorthHistory: [],
    instruments: [],
    investmentTransactions: [],
  };
}
