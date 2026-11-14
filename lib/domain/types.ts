/** Calendar date, `YYYY-MM-DD`, in the user's local time zone. */
export type ISODate = string;

/** Calendar month, `YYYY-MM`. */
export type MonthKey = string;

export type CategoryType = "expense" | "income";

export interface Category {
  id: string;
  name: string;
  color: string;
  type: CategoryType;
}

/** Whether a transaction is income or expense comes from its category. */
export interface Transaction {
  id: string;
  amount: number;
  categoryId: string;
  date: ISODate;
  note: string;
}

/** Monthly limit per expense category id, reused every month. */
export type Budgets = Record<string, number>;

export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline: ISODate;
  color: string;
}

export type Frequency = "weekly" | "monthly" | "yearly";

export interface RecurringItem {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  frequency: Frequency;
  nextDate: ISODate;
}

export type AccountKind = "asset" | "liability";

export interface Account {
  id: string;
  name: string;
  kind: AccountKind;
  balance: number;
}

export interface NetWorthSnapshot {
  month: MonthKey;
  assets: number;
  liabilities: number;
}

export interface AppData {
  version: 1;
  categories: Category[];
  transactions: Transaction[];
  budgets: Budgets;
  goals: Goal[];
  recurring: RecurringItem[];
  accounts: Account[];
  netWorthHistory: NetWorthSnapshot[];
}
