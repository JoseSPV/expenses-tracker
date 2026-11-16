/** Distinct, colorblind-friendlier defaults so new categories and goals don't all start indigo. */
export const PALETTE = ["#6366f1", "#22c55e", "#f97316", "#0ea5e9", "#eab308", "#ec4899", "#a855f7", "#14b8a6", "#f43f5e", "#64748b"];

/** First unused palette color, then a cycle once every color is taken. */
export function nextPaletteColor(used: readonly string[]): string {
  const taken = new Set(used.map((color) => color.toLowerCase()));
  return PALETTE.find((color) => !taken.has(color)) ?? PALETTE[used.length % PALETTE.length];
}
