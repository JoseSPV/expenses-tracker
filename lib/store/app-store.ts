import type { AppData } from "@/lib/domain/types";
import type { SeedText } from "@/i18n/types";
import { hasLegacyData, migrateLegacyData } from "./legacy-migration";
import { createSeedData } from "./seed";

const STORAGE_KEY = "expenses-tracker:data:v1";

const listeners = new Set<() => void>();
let data: AppData | null = null;

function isAppData(value: unknown): value is AppData {
  const candidate = value as AppData;
  return (
    typeof candidate === "object" &&
    candidate !== null &&
    candidate.version === 1 &&
    [candidate.categories, candidate.transactions, candidate.goals, candidate.recurring, candidate.accounts, candidate.netWorthHistory].every(Array.isArray) &&
    typeof candidate.budgets === "object"
  );
}

function readStored(): AppData | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isAppData(parsed)) return parsed;
  } catch {
    // Fall through: keep a copy instead of silently overwriting what the user had.
  }
  localStorage.setItem(`${STORAGE_KEY}:unreadable-${Date.now()}`, raw);
  return null;
}

function persist(): void {
  if (data) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent): void {
  if (event.key !== STORAGE_KEY) return;
  data = readStored() ?? data;
  emit();
}

/** Lazily loads stored data, migrates the legacy format, or seeds demo data on first visit. */
export function getSnapshot(seed: SeedText): AppData {
  if (!data) {
    data = readStored() ?? (hasLegacyData(localStorage) ? migrateLegacyData(localStorage, seed) : createSeedData(seed));
    persist();
  }
  return data;
}

/** Storage only exists in the browser; views render a placeholder until hydration. */
export const getServerSnapshot = (): AppData | null => null;

export function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

/** Single write path: the recipe mutates a copy, so every update yields a new snapshot. */
export function updateData(recipe: (draft: AppData) => void): void {
  if (!data) return;
  const draft = structuredClone(data);
  recipe(draft);
  data = draft;
  persist();
  emit();
}

export function replaceData(next: AppData): void {
  data = next;
  persist();
  emit();
}
