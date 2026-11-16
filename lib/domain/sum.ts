export function sum<T>(items: readonly T[], pick: (item: T) => number): number {
  return items.reduce((total, item) => {
    const value = pick(item);
    return Number.isFinite(value) ? total + value : total;
  }, 0);
}
