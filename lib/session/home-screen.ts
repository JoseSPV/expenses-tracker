export type HomeScreen = "trial" | "account";

/** Signed in opens the app. Signed out stays on the browser trial. Book count does not choose the screen. */
export function homeScreen(input: { signedIn: boolean }): HomeScreen {
  return input.signedIn ? "account" : "trial";
}
