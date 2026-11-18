import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/** Google returns here with a code. The code becomes the session cookie. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${url.origin}/es`);
  }
  return NextResponse.redirect(`${url.origin}/es?auth=error`);
}
