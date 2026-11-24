import type { AppData } from "@/lib/domain/types";

export function emptyAppData(): AppData {
  return {
    version: 2,
    categories: [],
    transactions: [],
    budgets: {},
    goals: [],
    recurring: [],
    accounts: [],
    netWorthHistory: [],
    instruments: [],
    investmentTransactions: [],
  };
}

/** Stored data wins. A signed-in visit with nothing stored starts empty and never receives the trial seed. */
export function documentForVisit(input: { account: boolean; stored: AppData | null; trialSeed: AppData }): AppData {
  if (input.stored) return input.stored;
  if (input.account) return emptyAppData();
  return input.trialSeed;
}
