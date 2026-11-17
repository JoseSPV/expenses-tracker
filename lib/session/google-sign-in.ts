export type SignInProblem = "offline" | "unavailable";

/** Why «Tus libros» cannot open Google yet. `null` means the button may start. */
export function signInProblem(input: { online: boolean; configured: boolean }): SignInProblem | null {
  if (!input.online) return "offline";
  if (!input.configured) return "unavailable";
  return null;
}
