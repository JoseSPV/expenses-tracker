/** Lowercase, accent-insensitive match key. `Nómina` and `nomina` compare equal. */
export function fold(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es");
}
