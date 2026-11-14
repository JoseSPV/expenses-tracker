"use client";

import { createContext, use, useState, useSyncExternalStore, type ReactNode } from "react";
import { addMonths, currentMonth } from "@/lib/domain/dates";
import type { MonthKey } from "@/lib/domain/types";

interface MonthValue {
  /** `null` until hydrated: "today" must come from the browser, not the build server. */
  month: MonthKey | null;
  isCurrent: boolean;
  shift: (delta: number) => void;
}

const MonthContext = createContext<MonthValue | null>(null);

const noopSubscribe = () => () => {};
const useHydrated = () => useSyncExternalStore(noopSubscribe, () => true, () => false);

/** Selected month shared across views; survives navigation because it lives in the layout. */
export function MonthProvider({ children }: { children: ReactNode }) {
  const [offset, setOffset] = useState(0);
  const hydrated = useHydrated();
  const value: MonthValue = {
    month: hydrated ? addMonths(currentMonth(), offset) : null,
    isCurrent: offset === 0,
    shift: (delta) => setOffset((current) => Math.min(0, current + delta)),
  };
  return <MonthContext value={value}>{children}</MonthContext>;
}

export function useMonth(): MonthValue {
  const value = use(MonthContext);
  if (!value) throw new Error("useMonth must be used inside <MonthProvider>");
  return value;
}
