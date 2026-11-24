/** Cents, half away from zero. Keeps stored amounts aligned with what the UI prints. */
export const roundMoney = (value: number): number => Math.round(value * 100) / 100;

/**
 * Parses a user-typed amount. A comma is the decimal separator (`12,5` and `1.234,5`).
 * A dot is the decimal separator only when there is no comma (`12.5`).
 */
export function parseMoney(raw: string, options?: { allowNegative?: boolean }): number | null {
  const value = parseDecimal(raw, options);
  return value === null ? null : roundMoney(value);
}

/** Same rules as `parseMoney`, unrounded: share counts and exchange rates need more than two decimals. */
export function parseDecimal(raw: string, options?: { allowNegative?: boolean }): number | null {
  const trimmed = raw.trim().replace(/\s/g, "");
  if (!trimmed) return null;
  const negative = trimmed.startsWith("-");
  if (negative && !options?.allowNegative) return null;
  const body = negative ? trimmed.slice(1) : trimmed;
  const normalized = body.includes(",") ? body.replace(/\./g, "").replace(",", ".") : body;
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  const value = (negative ? -1 : 1) * Number(normalized);
  return Number.isFinite(value) ? value : null;
}
