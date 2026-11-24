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
  /** Missing on data saved before versions existed. Treated as 1. */
  version?: number;
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

/** ISO 4217 code, e.g. `EUR`, `USD`. */
export type CurrencyCode = string;

export interface InstrumentPrice {
  /** In the instrument's currency. */
  value: number;
  /** EUR per 1 unit of the instrument's currency. */
  eurRate: number;
  date: ISODate;
}

export interface Instrument {
  id: string;
  ticker: string;
  name: string;
  currency: CurrencyCode;
  color: string;
  /** Entered by hand. Missing means the position has no market value. */
  price?: InstrumentPrice;
  version?: number;
}

export interface Fee {
  amount: number;
  /** `EUR` or the instrument's currency, as on the broker statement. */
  currency: CurrencyCode;
}

interface InvestmentOperationBase {
  id: string;
  instrumentId: string;
  date: ISODate;
  /** EUR per 1 unit of the instrument's currency on that day. */
  eurRate: number;
  fee: Fee;
  note: string;
  version?: number;
}

/** Original amounts are in the instrument's currency. `eur` is fixed when saved and is the figure every calculation uses. */
export interface TradeOperation extends InvestmentOperationBase {
  type: "buy" | "sell";
  quantity: number;
  unitPrice: number;
  eur: { gross: number; fee: number };
}

/** Spanish withholding is applied in EUR by the broker, so it has no original amount. */
export interface DividendOperation extends InvestmentOperationBase {
  type: "dividend";
  gross: number;
  withholdingOrigin: number;
  eur: { gross: number; withholdingOrigin: number; withholdingSpain: number; fee: number };
}

export type InvestmentTransaction = TradeOperation | DividendOperation;

export type InvestmentOperationType = InvestmentTransaction["type"];

export interface AppData {
  version: 2;
  categories: Category[];
  transactions: Transaction[];
  budgets: Budgets;
  goals: Goal[];
  recurring: RecurringItem[];
  accounts: Account[];
  netWorthHistory: NetWorthSnapshot[];
  instruments: Instrument[];
  investmentTransactions: InvestmentTransaction[];
}
