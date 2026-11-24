import type { InvestmentOperationType, InvestmentTransaction } from "../domain/types";

const PAGE_SIZE = 30;

interface Versioned {
  id: string;
  /** Missing on data saved before versions existed. Treated as 1. */
  version?: number;
}

export type SaveVersionedResult<T> = { ok: true; items: T[]; saved: T } | { ok: false; current: T } | { ok: false; missing: true };

/** Replaces an item only when `expectedVersion` is still the one stored. Returns a new list. */
export function saveVersioned<T extends Versioned>(items: readonly T[], input: Omit<T, "version">, expectedVersion: number): SaveVersionedResult<T> {
  const index = items.findIndex((item) => item.id === input.id);
  const current = items[index];
  if (!current) return { ok: false, missing: true };
  const version = current.version ?? 1;
  if (version !== expectedVersion) return { ok: false, current: { ...current, version } };
  const saved = { ...input, version: version + 1 } as T;
  const next = items.slice();
  next[index] = saved;
  return { ok: true, items: next, saved };
}

export type DeleteVersionedResult<T> = { ok: true; items: T[] } | { ok: false; current: T };

/** An item that is already gone counts as deleted, so a retry never reports a false error. */
export function deleteVersioned<T extends Versioned>(items: readonly T[], id: string, expectedVersion: number): DeleteVersionedResult<T> {
  const current = items.find((item) => item.id === id);
  if (!current) return { ok: true, items: items.slice() };
  const version = current.version ?? 1;
  if (version !== expectedVersion) return { ok: false, current: { ...current, version } };
  return { ok: true, items: items.filter((item) => item.id !== id) };
}

export interface OperationPage {
  items: InvestmentTransaction[];
  nextCursor?: string;
}

function byNewest(a: InvestmentTransaction, b: InvestmentTransaction): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return a.id < b.id ? -1 : 1;
}

/** One page of an instrument's operations, newest first. The cursor is the id of the last operation already shown. */
export function listInstrumentOperations(
  operations: readonly InvestmentTransaction[],
  query: { instrumentId: string; type?: InvestmentOperationType | "all"; cursor?: string },
): OperationPage {
  const type = query.type ?? "all";
  const ordered = operations
    .filter((op) => op.instrumentId === query.instrumentId && (type === "all" || op.type === type))
    .sort(byNewest);
  const cursorIndex = query.cursor ? ordered.findIndex((op) => op.id === query.cursor) : -1;
  if (query.cursor && cursorIndex === -1) return { items: [] };
  const start = query.cursor ? cursorIndex + 1 : 0;
  const items = ordered.slice(start, start + PAGE_SIZE);
  return ordered[start + PAGE_SIZE] ? { items, nextCursor: items.at(-1)?.id } : { items };
}
