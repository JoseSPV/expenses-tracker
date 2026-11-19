import { canonicalizeDate } from "@/lib/domain/dates";
import type { AppData } from "@/lib/domain/types";
import type { SeedText } from "@/i18n/types";
import { documentForVisit, emptyAppData } from "./document-for-visit";
import { hasLegacyData, migrateLegacyData } from "./legacy-migration";
import { createSeedData } from "./seed";

const TRIAL_KEY = "expenses-tracker:data:v1";

const listeners = new Set<() => void>();
let data: AppData | null = null;
let accountEmail: string | null = null;

/** Signed-in data uses its own key. Null keeps the trial key. */
export function bindAccount(email: string | null): void {
  if (typeof window === "undefined" || accountEmail === email) return;
  accountEmail = email;
  data = null;
}

function storageKey(): string {
  return accountEmail === null ? TRIAL_KEY : `expenses-tracker:account:v1:${accountEmail}`;
}

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

function readKey(key: string): AppData | null {
  const raw = localStorage.getItem(key);
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
  localStorage.setItem(`${key}:unreadable-${Date.now()}`, raw);
  return null;
}

function persist(): void {
  if (data) localStorage.setItem(storageKey(), JSON.stringify(data));
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent): void {
  if (event.key !== storageKey()) return;
  data = readKey(storageKey()) ?? data;
  emit();
}

/** Lazily loads the visit. The trial may seed demo data. A signed-in visit starts empty and never reads the trial. */
export function getSnapshot(seed: SeedText): AppData {
  if (!data) {
    const stored = readKey(storageKey());
    const trialSeed =
      accountEmail === null && !stored
        ? hasLegacyData(localStorage)
          ? migrateLegacyData(localStorage, seed)
          : createSeedData(seed)
        : emptyAppData();
    data = documentForVisit({ account: accountEmail !== null, stored, trialSeed });
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
