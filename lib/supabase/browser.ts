import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "./env";

/** Browser client. Used to start Google sign-in. The session cookie stays HttpOnly on the server. */
export function createBrowserSupabase() {
  const env = supabaseEnv();
  if (!env) throw new Error("Supabase is not configured");
  return createBrowserClient(env.url, env.key);
}
