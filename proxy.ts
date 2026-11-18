import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, hasLocale, locales, type Locale } from "./i18n/config";
import { updateSession } from "./lib/supabase/update-session";

/** Picks the first supported language from `Accept-Language`, honouring q-values. */
function preferredLocale(request: NextRequest): Locale {
  const header = request.headers.get("accept-language") ?? "";
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { language: tag.split("-")[0].toLowerCase(), quality: q ? Number(q.trim().slice(2)) : 1 };
    })
    .filter((entry) => entry.language && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality);

  const language = ranked.map((entry) => entry.language).find(hasLocale);
  return language ?? defaultLocale;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // The Google return route has no language prefix. A redirect would drop the code.
  if (pathname === "/auth" || pathname.startsWith("/auth/")) return updateSession(request);

  const hasLocalePrefix = locales.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
  if (!hasLocalePrefix) {
    request.nextUrl.pathname = `/${preferredLocale(request)}${pathname}`;
    return NextResponse.redirect(request.nextUrl);
  }
  return updateSession(request);
}

export const config = {
  // Skip Next internals and any path with a file extension (favicon, public assets).
  matcher: ["/((?!_next|.*\\..*).*)"],
};
