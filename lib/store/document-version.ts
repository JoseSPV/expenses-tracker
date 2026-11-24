import type { AppData } from "@/lib/domain/types";

type StoredV1 = Omit<AppData, "version" | "instruments" | "investmentTransactions"> & { version: 1 };

function hasV1Shape(value: StoredV1 | AppData): boolean {
  return (
    [value.categories, value.transactions, value.goals, value.recurring, value.accounts, value.netWorthHistory].every(Array.isArray) &&
    typeof value.budgets === "object" &&
    value.budgets !== null
  );
}

/** Reads any stored document version and returns the current one, or `null` when it is not a document. */
export function upgradeDocument(value: unknown): AppData | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as StoredV1 | AppData;
  if (!hasV1Shape(candidate)) return null;
  if (candidate.version === 1) return { ...candidate, version: 2, instruments: [], investmentTransactions: [] };
  if (candidate.version === 2 && Array.isArray(candidate.instruments) && Array.isArray(candidate.investmentTransactions)) return candidate;
  return null;
}
