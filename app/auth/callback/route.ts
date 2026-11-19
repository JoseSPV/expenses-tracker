import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale } from "@/i18n/config";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseEnv } from "@/lib/supabase/env";

/** Google returns here with a code. The code becomes the session cookie and is not forwarded. */
export async function GET(request: NextRequest) {
  const home = new URL(`/${defaultLocale}`, request.nextUrl.origin);
  const code = request.nextUrl.searchParams.get("code");
  if (code && supabaseEnv()) {
    try {
      const supabase = await createServerSupabase();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(home);
    } catch {
      // A failed exchange is the same for the person as a missing code.
    }
  }
  home.searchParams.set("auth", "error");
  return NextResponse.redirect(home);
}
