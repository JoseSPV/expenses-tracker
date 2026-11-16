import { canonicalizeDate } from "@/lib/domain/dates";
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
    if (isAppData(parsed)) {
      parsed.transactions.forEach((t) => (t.date = canonicalizeDate(t.date)));
      return parsed;
    }
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

/** Current snapshot without loading or seeding. Writes read this so they see their own previous update. */
export function peekData(): AppData | null {
  return data;
}

/**
 * Single write path: the recipe mutates a copy, so every update yields a new snapshot.
 * Return `false` from the recipe to discard the copy (validation failed, nothing changed).
 */
export function updateData(recipe: (draft: AppData) => boolean | void): boolean {
  if (!data) return false;
  const draft = structuredClone(data);
  if (recipe(draft) === false) return false;
  data = draft;
  persist();
  emit();
  return true;
}

export function replaceData(next: AppData): void {
  data = next;
  persist();
  emit();
}
