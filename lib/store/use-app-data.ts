"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { AppData } from "@/lib/domain/types";
import { useI18n } from "@/i18n/i18n-provider";
import { getServerSnapshot, getSnapshot, subscribe } from "./app-store";

/** `null` during server rendering and hydration. */
export function useAppData(): AppData | null {
  const { dict } = useI18n();
  const getLocalizedSnapshot = useCallback(() => getSnapshot(dict.seed), [dict.seed]);
  return useSyncExternalStore(subscribe, getLocalizedSnapshot, getServerSnapshot);
}
