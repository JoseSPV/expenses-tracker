"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Plus, SunMoon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionFormDialog } from "@/features/transactions/transaction-form-dialog";
import { HelpTour } from "@/features/tour/help-tour";
import { useI18n } from "@/i18n/i18n-provider";
import { homeScreen } from "@/lib/session/home-screen";
import { shellTitle } from "@/lib/session/shell-content";
import type { Person } from "@/lib/session/placeholders";
import { bindAccount } from "@/lib/store/app-store";
import { cn } from "@/lib/utils";
import { MonthProvider, useMonth } from "./month-context";
import { ACCOUNT_ITEMS, NAV_ITEMS, activeNavItem, hrefFor, type NavItem } from "./navigation";
import { PersonProvider } from "./person-context";
import { toggleTheme } from "./theme";

function NavLinks({ items, activeSegment }: { items: NavItem[]; activeSegment?: string }) {
  const { locale, dict } = useI18n();

  return items.map(({ segment, labelKey, icon: Icon }) => {
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
  });
}

function Sidebar({ activeSegment }: { activeSegment?: string }) {
  const { locale, dict } = useI18n();
  const navRef = useRef<HTMLDivElement>(null);

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
        "fixed inset-x-0 bottom-0 z-20 border-t bg-surface px-1 pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom))] md:border-t-0",
      )}
    >
      <Link href={hrefFor(locale, "")} className="hidden items-center gap-2.5 px-2 text-lg font-bold md:flex">
        <span className="grid size-8 place-items-center rounded-[10px] bg-primary font-extrabold text-primary-fg">J</span>
        {dict.meta.appName}
      </Link>
      <div
        ref={navRef}
        className="flex gap-1 overflow-x-auto [scrollbar-width:none] md:min-h-0 md:flex-1 md:flex-col md:overflow-visible md:[&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:hidden"
      >
        <nav aria-label={dict.nav.label} className="flex gap-1 md:flex-col md:gap-1">
          <NavLinks items={NAV_ITEMS} activeSegment={activeSegment} />
        </nav>
        <span aria-hidden className="mx-1 w-px shrink-0 self-stretch bg-border md:mx-0 md:my-3 md:h-px md:w-full" />
        <nav aria-label={dict.nav.account} className="flex gap-1 md:mt-auto md:flex-col md:gap-1">
          <p className="hidden px-3 text-xs font-medium text-muted md:block">{dict.nav.account}</p>
          <NavLinks items={ACCOUNT_ITEMS} activeSegment={activeSegment} />
        </nav>
      </div>
    </aside>
  );
}

function MonthPicker() {
  const { dict, format } = useI18n();
  const { month, canGoForward, shift } = useMonth();

  return (
    <div data-tour="month" className="order-3 flex w-full items-center justify-between gap-0.5 rounded-full border bg-surface p-0.5 sm:order-none sm:w-auto">
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

export function AppShell({ children, person }: { children: ReactNode; person: Person | null }) {
  const { locale, dict } = useI18n();
  const pathname = usePathname();
  const active = activeNavItem(pathname, locale);
  const account = homeScreen({ signedIn: person !== null }) === "account";
  bindAccount(account ? person?.email || "signed-in" : null);
  const privacy = pathname === hrefFor(locale, "privacy");
  const title = shellTitle({
    privacy,
    privacyTitle: dict.privacy.title,
    sectionTitle: active ? dict.nav[active.labelKey] : null,
    appName: dict.meta.appName,
  });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const skipFocus = useRef(true);
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const closeTransaction = () => setTransactionOpen(false);

  useEffect(() => {
    if (skipFocus.current) {
      skipFocus.current = false;
      return;
    }
    if (tourActive) return;
    headingRef.current?.focus();
  }, [pathname, tourActive]);

  return (
    <PersonProvider person={person}>
      <MonthProvider>
        <div className="grid min-h-screen md:grid-cols-[232px_minmax(0,1fr)]">
          <Sidebar activeSegment={active?.segment} />
          <div className="min-w-0">
            <header className="sticky top-0 z-10 flex flex-wrap items-center gap-4 border-b bg-bg/85 px-4 py-3 backdrop-blur-md md:px-8">
              <h1 ref={headingRef} tabIndex={-1} className="min-w-0 flex-1 truncate text-xl font-bold sm:text-[22px]">
                {title}
              </h1>
              {active?.usesMonth ? <MonthPicker /> : null}
              <div className="flex gap-1.5">
                <Button variant="ghost" size="icon" onClick={toggleTheme} title={dict.shell.toggleTheme} aria-label={dict.shell.toggleTheme}>
                  <SunMoon size={18} />
                </Button>
                <HelpTour pathname={pathname} onForm={setTransactionOpen} onActive={setTourActive} />
                <Button variant="primary" data-tour="add-transaction" onClick={() => setTransactionOpen(true)} aria-label={dict.shell.addTransaction}>
                  <Plus size={16} aria-hidden />
                  <span className="max-sm:hidden">{dict.shell.addTransaction}</span>
                </Button>
              </div>
            </header>
            <main className="max-w-7xl px-4 pt-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:px-8 md:pb-12">
              {children}
            </main>
          </div>
        </div>
        <TransactionFormDialog open={transactionOpen} onClose={closeTransaction} />
      </MonthProvider>
    </PersonProvider>
  );
}
