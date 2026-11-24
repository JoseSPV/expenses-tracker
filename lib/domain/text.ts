/** Lowercase, accent-insensitive match key. `Nómina` and `nomina` compare equal. */
export function fold(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/** Case-insensitive identity of a name the user typed. Independent of the interface language. */
export const nameKey = (value: string): string => value.trim().toLowerCase();

export const tickerKey = (value: string): string => value.trim().toUpperCase();

export const isNameTaken = (items: readonly { id: string; name: string }[], name: string, exceptId?: string): boolean => {
  const key = nameKey(name);
  return items.some((item) => item.id !== exceptId && nameKey(item.name) === key);
};
