/** The public project URL and the publishable key. Missing, or refused, until both are safe to ship to the browser. */
export function supabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !isProjectUrl(url) || isServiceRoleKey(key)) return null;
  return { url, key };
}

function isProjectUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".supabase.co") && url.username === "" && url.password === "";
  } catch {
    return false;
  }
}

/** The service-role key bypasses every access rule. It must never reach the browser. */
function isServiceRoleKey(value: string): boolean {
  if (value.includes("service_role")) return true;
  const segment = value.split(".")[1];
  if (!segment) return false;
  const payload = decodeJwtPayload(segment);
  return payload?.includes("service_role") ?? false;
}

function decodeJwtPayload(segment: string): string | null {
  try {
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return atob(padded);
  } catch {
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  return supabaseEnv() !== null;
}
