import { addDays, addMonths, currentMonth, dateInMonth, dayOfMonth, daysInMonth, nextOccurrence, today } from "@/lib/domain/dates";
import { netWorthTotals } from "@/lib/domain/selectors";
import type { Account, AppData, Category, RecurringItem, Transaction } from "@/lib/domain/types";
import type { SeedText } from "@/i18n/types";

type SeedCategoryId = keyof SeedText["categories"];

const CATEGORY_DEFINITIONS: { id: SeedCategoryId; color: string; type: Category["type"] }[] = [
  { id: "housing", color: "#6366f1", type: "expense" },
  { id: "groceries", color: "#22c55e", type: "expense" },
  { id: "dining", color: "#f97316", type: "expense" },
  { id: "transport", color: "#0ea5e9", type: "expense" },
  { id: "utilities", color: "#eab308", type: "expense" },
  { id: "entertainment", color: "#ec4899", type: "expense" },
  { id: "shopping", color: "#a855f7", type: "expense" },
  { id: "health", color: "#14b8a6", type: "expense" },
  { id: "subscriptions", color: "#f43f5e", type: "expense" },
  { id: "other", color: "#94a3b8", type: "expense" },
  { id: "salary", color: "#10b981", type: "income" },
  { id: "freelance", color: "#3b82f6", type: "income" },
  { id: "otherIncome", color: "#64748b", type: "income" },
];

export const INCOME_CATEGORY_IDS: SeedCategoryId[] = ["salary", "freelance", "otherIncome"];

export function seedCategories(text: SeedText, ids?: SeedCategoryId[]): Category[] {
  return CATEGORY_DEFINITIONS.filter((c) => !ids || ids.includes(c.id)).map((c) => ({
    ...c,
    name: text.categories[c.id],
  }));
}

const BUDGETS: Partial<Record<SeedCategoryId, number>> = {
  housing: 850,
  groceries: 350,
  dining: 180,
  transport: 120,
  utilities: 150,
  entertainment: 80,
  shopping: 150,
  health: 80,
  subscriptions: 40,
};

/** Deterministic PRNG (mulberry32) so demo data looks the same on every reset. */
function createRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createTransactions(text: SeedText): Transaction[] {
  const random = createRandom(42);
  const between = (min: number, max: number) => Math.round((min + random() * (max - min)) * 100) / 100;
  const pick = (list: string[]) => list[Math.floor(random() * list.length)];
  const now = today();
  const notes = text.notes;
  const transactions: Transaction[] = [];

  const add = (date: string, categoryId: SeedCategoryId, amount: number, note: string) => {
    if (date <= now) transactions.push({ id: `seed-${transactions.length + 1}`, date, categoryId, amount, note });
  };
  const repeat = (min: number, max: number, fn: () => void) => {
    const count = min + Math.floor(random() * (max - min + 1));
    for (let i = 0; i < count; i++) fn();
  };

  for (let offset = -5; offset <= 0; offset++) {
    const month = addMonths(currentMonth(), offset);
    const day = (d: number) => dateInMonth(month, d);
    const lastDay = month === currentMonth() ? Math.min(28, dayOfMonth(now)) : 28;
    const randomDay = () => day(1 + Math.floor(random() * lastDay));

    add(day(1), "salary", 2450, notes.salary);
    if (random() > 0.4) add(day(15), "freelance", between(250, 700), pick(notes.freelance));

    add(day(1), "housing", 850, notes.rent);
    add(day(2), "transport", 54.6, notes.transitPass);
    add(day(3), "health", 39, notes.gym);
    add(day(5), "utilities", between(85, 130), notes.utilities);
    add(day(8), "utilities", 20, notes.mobile);
    add(day(10), "subscriptions", 12.99, notes.netflix);
    add(day(12), "subscriptions", 10.99, notes.spotify);

    for (let d = 2; d <= daysInMonth(month); d += 3 + Math.floor(random() * 2)) {
      add(day(d), "groceries", between(22, 78), pick(notes.groceries));
    }
    repeat(5, 8, () => add(randomDay(), "dining", between(12, 48), pick(notes.dining)));
    repeat(1, 3, () => add(randomDay(), "transport", between(8, 45), pick(notes.transport)));
    repeat(1, 3, () => add(randomDay(), "entertainment", between(10, 40), pick(notes.entertainment)));
    repeat(1, 3, () => add(randomDay(), "shopping", between(20, 120), pick(notes.shopping)));
    if (random() > 0.5) add(randomDay(), "health", between(8, 35), notes.pharmacy);
    if (random() > 0.5) add(randomDay(), "other", between(5, 40), pick(notes.other));
  }
  return transactions;
}

function createRecurring(text: SeedText): RecurringItem[] {
  const names = text.recurring;
  const now = today();
  const item = (id: keyof SeedText["recurring"], amount: number, categoryId: SeedCategoryId, frequency: RecurringItem["frequency"], nextDate: string) =>
    ({ id: `rec-${id}`, name: names[id], amount, categoryId, frequency, nextDate });

  return [
    item("salary", 2450, "salary", "monthly", nextOccurrence(1)),
    item("rent", 850, "housing", "monthly", nextOccurrence(1)),
    item("transitPass", 54.6, "transport", "monthly", nextOccurrence(2)),
    item("gym", 39, "health", "monthly", nextOccurrence(3)),
    item("mobile", 20, "utilities", "monthly", nextOccurrence(8)),
    item("netflix", 12.99, "subscriptions", "monthly", nextOccurrence(10)),
    item("spotify", 10.99, "subscriptions", "monthly", nextOccurrence(12)),
    item("cloud", 29.99, "subscriptions", "yearly", addDays(now, 19)),
    item("carInsurance", 480, "transport", "yearly", addDays(now, 47)),
  ];
}

function createNetWorth(text: SeedText) {
  const names = text.accounts;
  const accounts: Account[] = [
    { id: "acc-checking", name: names.checking, kind: "asset", balance: 3180 },
    { id: "acc-savings", name: names.savings, kind: "asset", balance: 6050 },
    { id: "acc-index", name: names.index, kind: "asset", balance: 12480 },
    { id: "acc-car", name: names.car, kind: "asset", balance: 9000 },
    { id: "acc-car-loan", name: names.carLoan, kind: "liability", balance: 6200 },
    { id: "acc-credit-card", name: names.creditCard, kind: "liability", balance: 420 },
  ];
  const { assets, liabilities } = netWorthTotals(accounts);
  const netWorthHistory = Array.from({ length: 6 }, (_, i) => {
    const offset = i - 5;
    return {
      month: addMonths(currentMonth(), offset),
      assets: assets + offset * 640 + (offset % 2) * 180,
      liabilities: liabilities - offset * 310,
    };
  });
  return { accounts, netWorthHistory };
}

export function createSeedData(text: SeedText): AppData {
  const month = currentMonth();
  return {
    version: 1,
    categories: seedCategories(text),
    transactions: createTransactions(text),
    budgets: { ...BUDGETS } as Record<string, number>,
    goals: [
      { id: "goal-emergency", name: text.goals.emergency, target: 9000, saved: 4200, deadline: `${addMonths(month, 12)}-01`, color: "#10b981" },
      { id: "goal-trip", name: text.goals.trip, target: 3500, saved: 1250, deadline: `${addMonths(month, 8)}-01`, color: "#f43f5e" },
      { id: "goal-laptop", name: text.goals.laptop, target: 1800, saved: 600, deadline: `${addMonths(month, 4)}-15`, color: "#6366f1" },
    ],
    recurring: createRecurring(text),
    ...createNetWorth(text),
  };
}
