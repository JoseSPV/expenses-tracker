// Type-only imports: `node --test` loads this file without a bundler to resolve extensionless paths.
import type { AppData } from "@/lib/domain/types";

export type TrialImportResult = { result: "imported"; data: AppData } | { result: "notEmpty" | "nothing" };

const CREATED_BY_HAND = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Demo items have fixed ids. Anything created in the app gets a random UUID; edited movements and operations go past version 1. */
export function hasOwnData(document: AppData): boolean {
  const items = [
    ...document.categories,
    ...document.transactions,
    ...document.goals,
    ...document.recurring,
    ...document.accounts,
    ...document.instruments,
    ...document.investmentTransactions,
  ];
  return items.some((item) => CREATED_BY_HAND.test(item.id) || ("version" in item && (item.version ?? 1) > 1));
}

/** Net worth history alone is not content: it only follows the accounts. */
export function isEmptyDocument(document: AppData): boolean {
  return (
    document.categories.length === 0 &&
    document.transactions.length === 0 &&
    Object.keys(document.budgets).length === 0 &&
    document.goals.length === 0 &&
    document.recurring.length === 0 &&
    document.accounts.length === 0 &&
    document.instruments.length === 0 &&
    document.investmentTransactions.length === 0
  );
}

/** One write with the whole trial, or nothing. The trial itself is never changed. */
export function importTrialData(target: AppData, trial: AppData | null): TrialImportResult {
  if (!isEmptyDocument(target)) return { result: "notEmpty" };
  if (!trial || !hasOwnData(trial)) return { result: "nothing" };
  return { result: "imported", data: structuredClone(trial) };
}
