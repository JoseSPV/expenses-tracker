import type { Person } from "@/lib/session/placeholders";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseEnv } from "@/lib/supabase/env";

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

/** Name and email from a verified Google token. Null when nobody is signed in. */
export async function readPerson(): Promise<Person | null> {
  if (!supabaseEnv()) return null;
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims) return null;
    const claims = data.claims;
    const meta = claims.user_metadata;
    const record = meta && typeof meta === "object" ? (meta as Record<string, unknown>) : {};
    const email = text(claims.email) ?? "";
    const name = text(record.full_name) ?? text(record.name) ?? email;
    if (!name) return null;
    return { name, email };
  } catch {
    return null;
  }
}
