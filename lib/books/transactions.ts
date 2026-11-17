export interface Movement {
  id: string;
  amount: number;
  categoryId: string;
  date: string;
  note: string;
  version: number;
}

export interface MovementPage {
  items: Movement[];
  nextCursor?: string;
}

const PAGE_SIZE = 30;

function byNewest(a: Movement, b: Movement): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return a.id < b.id ? 1 : -1;
}

export type SaveTransactionResult =
  | { ok: true; movements: Movement[] }
  | { ok: false; current: Movement };

/** Replaces a movement only when `expectedVersion` is still the one stored. Returns a new list. */
export function saveTransaction(
  movements: Movement[],
  input: Omit<Movement, "version"> & { expectedVersion: number },
): SaveTransactionResult {
  const index = movements.findIndex((movement) => movement.id === input.id);
  const current = movements[index];
  if (!current || current.version !== input.expectedVersion) {
    return { ok: false, current: current ?? { ...input, version: input.expectedVersion } };
  }
  const saved: Movement = {
    id: input.id,
    amount: input.amount,
    categoryId: input.categoryId,
    date: input.date,
    note: input.note,
    version: current.version + 1,
  };
  const next = movements.slice();
  next[index] = saved;
  return { ok: true, movements: next };
}

/** One page of movements in a month. The cursor is the id of the last movement already shown. */
export function listMonthTransactions(movements: Movement[], query: { month: string; cursor?: string }): MovementPage {
  const ordered = movements.filter((movement) => movement.date.startsWith(query.month)).sort(byNewest);
  const start = query.cursor ? ordered.findIndex((movement) => movement.id === query.cursor) + 1 : 0;
  const items = ordered.slice(start, start + PAGE_SIZE);
  const next = ordered[start + PAGE_SIZE];
  return next ? { items, nextCursor: items.at(-1)?.id } : { items };
}
