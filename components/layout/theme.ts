export const THEME_STORAGE_KEY = "expenses-tracker:theme";

/** Runs before paint (inlined in the root layout) so the stored theme never flashes. */
export const themeInitScript = `document.documentElement.dataset.theme = localStorage.getItem("${THEME_STORAGE_KEY}") ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");`;

export function toggleTheme(): void {
  const root = document.documentElement;
  const theme = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}
