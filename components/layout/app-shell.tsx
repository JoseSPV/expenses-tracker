"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Database, Plus, SunMoon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionFormDialog } from "@/features/transactions/transaction-form-dialog";
import { useI18n } from "@/i18n/i18n-provider";
import { signInProblem } from "@/lib/session/google-sign-in";
import { homeScreen } from "@/lib/session/home-screen";
import { mainRegion, shellTitle } from "@/lib/session/shell-content";
import { listBooks, type Person } from "@/lib/session/placeholders";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";
import { DataDialog } from "./data-dialog";
import { MonthProvider, useMonth } from "./month-context";
import { NAV_ITEMS, activeNavItem, hrefFor } from "./navigation";
import { BookUnavailable, BooksUnknown, NoBooks, SignedInBar } from "./session-chrome";
import { toggleTheme } from "./theme";

function Sidebar({ activeSegment, showSections }: { activeSegment?: string; showSections: boolean }) {
  const { locale, dict } = useI18n();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navRef.current;
    const current = nav?.querySelector<HTMLElement>("[aria-current='page']");
    if (!nav || !current || nav.scrollWidth <= nav.clientWidth) return;
    nav.scrollLeft = Math.max(0, current.offsetLeft - (nav.clientWidth - current.offsetWidth) / 2);
  }, [activeSegment]);

  return (
    <aside
      className={cn(
        "md:sticky md:top-0 md:flex md:h-screen md:flex-col md:gap-7 md:border-r md:bg-surface md:px-4 md:py-6",
        showSections
          ? "fixed inset-x-0 bottom-0 z-20 border-t bg-surface px-1 pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom))] md:border-t-0"
          : "hidden",
      )}
    >
      <Link href={hrefFor(locale, "")} className="hidden items-center gap-2.5 px-2 text-lg font-bold md:flex">
        <span className="grid size-8 place-items-center rounded-[10px] bg-primary font-extrabold text-primary-fg">J</span>
        {dict.meta.appName}
      </Link>
      {showSections ? <nav
        ref={navRef}
        aria-label={dict.nav.label}
        className="flex gap-1 overflow-x-auto [scrollbar-width:none] md:flex-col md:overflow-visible md:gap-1 [&::-webkit-scrollbar]:hidden"
      >
        {NAV_ITEMS.map(({ segment, labelKey, icon: Icon }) => {
          const active = segment === activeSegment;
          return (
            <Link
              key={labelKey}
              href={hrefFor(locale, segment)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 min-w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-[10px] px-2.5 py-1.5 text-[11px] leading-none font-medium text-muted hover:bg-surface-2 hover:text-fg md:min-h-0 md:w-full md:min-w-0 md:shrink md:flex-row md:justify-start md:gap-3 md:px-3 md:py-2.5 md:text-[15px] md:leading-normal",
                active && "bg-primary/13 text-primary hover:bg-primary/13 hover:text-primary",
              )}
            >
              <Icon size={20} strokeWidth={1.8} aria-hidden />
              <span>{dict.nav[labelKey]}</span>
            </Link>
          );
        })}
      </nav> : null}
    </aside>
  );
}

function MonthPicker() {
  const { dict, format } = useI18n();
  const { month, canGoForward, shift } = useMonth();

  return (
    <div className="order-3 flex w-full items-center justify-between gap-0.5 rounded-full border bg-surface p-0.5 sm:order-none sm:w-auto">
      <Button variant="ghost" size="icon" className="rounded-full" onClick={() => shift(-1)} aria-label={dict.shell.previousMonth}>
        <ChevronLeft size={18} />
      </Button>
      <span className="min-w-0 flex-1 px-1 text-center text-sm font-semibold sm:min-w-36 sm:flex-none">{month ? format.month(month) : "\u00a0"}</span>
      <Button variant="ghost" size="icon" className="rounded-full" onClick={() => shift(1)} disabled={!canGoForward} aria-label={dict.shell.nextMonth}>
        <ChevronRight size={18} />
      </Button>
    </div>
  );
}

function subscribeToNothing() {
  return () => {};
}

function googleReturnFailed(): boolean {
  return new URLSearchParams(window.location.search).get("auth") === "error";
}

function SignedOutBar() {
  const { dict, locale } = useI18n();
  const text = dict.shell;
  const returnedWithError = useSyncExternalStore(subscribeToNothing, googleReturnFailed, () => false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const shown = message ?? (returnedWithError ? text.signInFailed : null);

  const openBooks = async () => {
    const problem = signInProblem({ online: navigator.onLine, configured: isSupabaseConfigured() });
    if (problem === "offline") {
      setMessage(text.signInOffline);
      return;
    }
    if (problem) {
      setMessage(text.signInUnavailable);
      return;
    }
    setMessage(null);
    setPending(true);
    const { error } = await createBrowserSupabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setPending(false);
      setMessage(text.signInFailed);
    }
  };

  return (
    <div className="flex w-full basis-full flex-wrap items-center gap-x-3 gap-y-1">
      <p className="text-sm font-medium">{text.signedOut}</p>
      <Button variant="primary" className="min-h-11" onClick={openBooks} disabled={pending} aria-busy={pending}>
        {text.yourBooks}
      </Button>
      <Link href={hrefFor(locale, "privacy")} className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline">
        {text.privacy}
      </Link>
      {shown ? (
        <p role="status" className="w-full text-sm text-danger">
          {shown}
        </p>
      ) : null}
    </div>
  );
}

export function AppShell({ children, person }: { children: ReactNode; person: Person | null }) {
  const { locale, dict } = useI18n();
  const pathname = usePathname();
  const active = activeNavItem(pathname, locale);
  const books = person ? listBooks() : null;
  const screen = homeScreen({
    signedIn: person !== null,
    books: books === null ? 0 : books.ok ? books.books.length : "unknown",
  });
  const trial = screen === "trial";
  const privacy = pathname === hrefFor(locale, "privacy");
  const region = mainRegion({ screen, privacy });
  const title = shellTitle({
    privacy,
    trial,
    privacyTitle: dict.privacy.title,
    sectionTitle: active ? dict.nav[active.labelKey] : null,
    booksTitle: dict.shell.yourBooks,
    appName: dict.meta.appName,
  });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const skipFocus = useRef(true);
  const [openDialog, setOpenDialog] = useState<"transaction" | "data" | null>(null);
  const closeDialog = () => setOpenDialog(null);

  useEffect(() => {
    if (skipFocus.current) {
      skipFocus.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [pathname]);

  return (
    <MonthProvider>
      <div className="grid min-h-screen md:grid-cols-[232px_minmax(0,1fr)]">
        <Sidebar activeSegment={active?.segment} showSections={trial} />
        <div className="min-w-0">
          <header className="sticky top-0 z-10 flex flex-wrap items-center gap-4 border-b bg-bg/85 px-4 py-3 backdrop-blur-md md:px-8">
            {person ? <SignedInBar person={person} /> : <SignedOutBar />}
            <h1 ref={headingRef} tabIndex={-1} className="min-w-0 flex-1 truncate text-xl font-bold sm:text-[22px]">
              {title}
            </h1>
            {trial && active?.usesMonth ? <MonthPicker /> : null}
            <div className="flex gap-1.5">
              {trial ? (
                <Button variant="ghost" size="icon" onClick={() => setOpenDialog("data")} title={dict.shell.manageData} aria-label={dict.shell.manageData}>
                  <Database size={18} />
                </Button>
              ) : null}
              <Button variant="ghost" size="icon" onClick={toggleTheme} title={dict.shell.toggleTheme} aria-label={dict.shell.toggleTheme}>
                <SunMoon size={18} />
              </Button>
              {trial ? (
                <Button variant="primary" onClick={() => setOpenDialog("transaction")} aria-label={dict.shell.addTransaction}>
                  <Plus size={16} aria-hidden />
                  <span className="max-sm:hidden">{dict.shell.addTransaction}</span>
                </Button>
              ) : null}
            </div>
          </header>
          <main className="max-w-7xl px-4 pt-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:px-8 md:pb-12">
            {region === "page" ? children : null}
            {region === "no-books" ? <NoBooks /> : null}
            {region === "books-unknown" ? <BooksUnknown /> : null}
            {region === "book" ? <BookUnavailable /> : null}
          </main>
        </div>
      </div>
      <TransactionFormDialog open={openDialog === "transaction"} onClose={closeDialog} />
      <DataDialog open={openDialog === "data"} onClose={closeDialog} />
    </MonthProvider>
  );
}
