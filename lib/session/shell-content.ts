import type { HomeScreen } from "./home-screen";

/** What the main region paints. Privacy is its own page, including while signed in. */
export type MainRegion = "page" | "no-books" | "books-unknown" | "book";

export function mainRegion(input: { screen: HomeScreen; privacy: boolean }): MainRegion {
  if (input.privacy || input.screen === "trial") return "page";
  return input.screen;
}

export function shellTitle(input: {
  privacy: boolean;
  trial: boolean;
  privacyTitle: string;
  sectionTitle: string | null;
  booksTitle: string;
  appName: string;
}): string {
  if (input.privacy) return input.privacyTitle;
  if (input.trial) return input.sectionTitle ?? input.appName;
  return input.booksTitle;
}
