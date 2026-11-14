export const PAD = { top: 12, right: 12, bottom: 28, left: 64 };
const TICKS = 4;
const NICE_STEPS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];

/** Rounds an extent up so each of the TICKS intervals is a "nice" number. */
function niceExtent(value: number): number {
  if (value <= 0) return 0;
  const rawStep = value / TICKS;
  const exponent = 10 ** Math.floor(Math.log10(rawStep));
  const step = (NICE_STEPS.find((s) => s * exponent >= rawStep) ?? 10) * exponent;
  return step * TICKS;
}

export function createScale(values: number[], height: number) {
  const max = niceExtent(Math.max(...values, 0)) || 1;
  const min = -niceExtent(-Math.min(0, ...values));
  const innerHeight = height - PAD.top - PAD.bottom;
  const y = (value: number) => PAD.top + innerHeight - ((value - min) / (max - min)) * innerHeight;
  const ticks = Array.from({ length: TICKS + 1 }, (_, i) => min + ((max - min) * i) / TICKS);
  return { y, ticks, baseline: y(Math.max(min, 0)) };
}

/** Indices of x labels to draw, counted back from the last so the final label always shows. */
export function visibleLabelIndices(count: number, maxLabels: number): Set<number> {
  const step = Math.ceil(count / maxLabels);
  return new Set(Array.from({ length: count }, (_, i) => i).filter((i) => (count - 1 - i) % step === 0));
}
