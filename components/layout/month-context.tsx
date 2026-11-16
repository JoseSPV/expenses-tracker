"use client";

import { createContext, use, useCallback, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { addMonths, currentMonth } from "@/lib/domain/dates";
import type { AppData, MonthKey } from "@/lib/domain/types";
import { peekData } from "@/lib/store/app-store";
import { useAppData } from "@/lib/store/use-app-data";

interface MonthValue {
  /** `null` until hydrated: "today" must come from the browser, not the build server. */
  month: MonthKey | null;
  isCurrent: boolean;
  /** False on the current month, and also on a later month that already has movements. */
  canGoForward: boolean;
  shift: (delta: number) => void;
  /** Jumps to a month. Months after the latest movement are clamped back. */
  goTo: (month: MonthKey) => void;
}

const MonthContext = createContext<MonthValue | null>(null);

const noopSubscribe = () => () => {};
const useHydrated = () => useSyncExternalStore(noopSubscribe, () => true, () => false);

/** How many months ahead of today still contain a movement. Past months are always reachable. */
function maxOffset(data: AppData | null): number {
  const now = currentMonth();
  let latest = now;
  for (const transaction of data?.transactions ?? []) {
    const month = transaction.date.slice(0, 7);
    if (/^\d{4}-\d{2}$/.test(month) && month > latest) latest = month;
  }
  const [latestYear, latestMonth] = latest.split("-").map(Number);
  const [currentYear, currentMonthNumber] = now.split("-").map(Number);
  return (latestYear - currentYear) * 12 + (latestMonth - currentMonthNumber);
}

function offsetFor(target: MonthKey, data: AppData | null): number {
  const now = currentMonth();
  const [targetYear, targetMonth] = target.split("-").map(Number);
  const [currentYear, currentMonthNumber] = now.split("-").map(Number);
  if (!targetYear || !targetMonth) return 0;
  return Math.min(maxOffset(data), (targetYear - currentYear) * 12 + (targetMonth - currentMonthNumber));
}

/** Selected month shared across views; survives navigation because it lives in the layout. */
export function MonthProvider({ children }: { children: ReactNode }) {
  const data = useAppData();
  const [offset, setOffset] = useState(0);
  const hydrated = useHydrated();
  const cap = maxOffset(data);
  // Drop a stored offset that pointed at a future month whose movement was just deleted.
  if (offset > cap) setOffset(cap);
  const shown = Math.min(offset, cap);

  const shift = useCallback((delta: number) => {
    setOffset((current) => Math.min(maxOffset(peekData()), current + delta));
  }, []);

  const goTo = useCallback((target: MonthKey) => {
    setOffset(offsetFor(target, peekData()));
  }, []);

  const value = useMemo<MonthValue>(
    () => ({
      month: hydrated ? addMonths(currentMonth(), shown) : null,
      isCurrent: shown === 0,
      canGoForward: shown < cap,
      shift,
      goTo,
    }),
    [cap, goTo, hydrated, shift, shown],
  );

  return <MonthContext value={value}>{children}</MonthContext>;
}

export function useMonth(): MonthValue {
  const value = use(MonthContext);
  if (!value) throw new Error("useMonth must be used inside <MonthProvider>");
  return value;
}
