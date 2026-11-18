"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

/** Clears the session cookie and returns to the trial. */
export async function signOutOfGoogle(): Promise<{ ok: false }> {
  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) return { ok: false };
  } catch {
    return { ok: false };
  }
  redirect("/es");
}
