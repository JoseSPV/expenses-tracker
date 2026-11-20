/** Whether this Google email may keep a session. An empty list allows nobody. */
export function isAllowedEmail(email: string, list: string | undefined): boolean {
  const candidate = email.trim().toLowerCase();
  if (!candidate || !list) return false;
  return list
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0)
    .includes(candidate);
}
