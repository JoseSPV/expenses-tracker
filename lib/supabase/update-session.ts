import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAllowedEmail } from "@/lib/session/allowlist";
import { supabaseEnv } from "./env";

/** Refreshes the session cookie before the page renders. Returns the response that carries the new cookie. */
export async function updateSession(request: NextRequest) {
  const env = supabaseEnv();
  if (!env) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
      },
    },
  });

  // Verifies the token. A forged cookie does not count as a session.
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims && typeof data.claims.email === "string" ? data.claims.email : "";
  if (email && !isAllowedEmail(email, process.env.ALLOWED_GOOGLE_EMAILS)) await supabase.auth.signOut();
  return response;
}
