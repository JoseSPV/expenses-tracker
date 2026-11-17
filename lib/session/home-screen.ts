export type HomeScreen = "trial" | "books-unknown" | "no-books" | "book";

/** Which screen the shell paints. A failed book list is not the same as having zero books. */
export function homeScreen(input: { signedIn: boolean; books: number | "unknown" }): HomeScreen {
  if (!input.signedIn) return "trial";
  if (input.books === "unknown") return "books-unknown";
  if (input.books === 0) return "no-books";
  return "book";
}
