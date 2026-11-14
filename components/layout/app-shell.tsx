"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Database, Plus, SunMoon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionFormDialog } from "@/features/transactions/transaction-form-dialog";
import { useI18n } from "@/i18n/i18n-provider";
import { cn } from "@/lib/utils";
import { DataDialog } from "./data-dialog";
import { MonthProvider, useMonth } from "./month-context";
import { NAV_ITEMS, activeNavItem, hrefFor } from "./navigation";
import { toggleTheme } from "./theme";

function Sidebar({ activeSegment }: { activeSegment?: string }) {
  const { locale, dict } = useI18n();

  return (
    <aside className="fixed inset-x-0 bottom-0 z-20 border-t bg-surface px-1 pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom))] md:sticky md:top-0 md:flex md:h-screen md:flex-col md:gap-7 md:border-t-0 md:border-r md:px-4 md:py-6">
      <Link href={hrefFor(locale, "")} className="hidden items-center gap-2.5 px-2 text-lg font-bold md:flex">
        <span className="grid size-8 place-items-center rounded-[10px] bg-primary font-extrabold text-primary-fg">J</span>
        {dict.meta.appName}
      </Link>
      <nav aria-label={dict.nav.label} className="flex justify-around md:flex-col md:justify-start md:gap-1">
        {NAV_ITEMS.map(({ segment, labelKey, icon: Icon }) => {
          const active = segment === activeSegment;
          return (
            <Link
              key={labelKey}
              href={hrefFor(locale, segment)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-[10px] p-2 text-[10px] font-medium text-muted hover:bg-surface-2 hover:text-fg md:flex-row md:gap-3 md:px-3 md:py-2.5 md:text-[15px]",
                active && "bg-primary/13 text-primary hover:bg-primary/13 hover:text-primary",
              )}
            >
              <Icon size={20} strokeWidth={1.8} aria-hidden />
              <span className="max-[480px]:sr-only">{dict.nav[labelKey]}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function MonthPicker() {
  const { dict, format } = useI18n();
  const { month, isCurrent, shift } = useMonth();

  return (
    <div className="order-3 flex w-full items-center justify-between gap-0.5 rounded-full border bg-surface p-0.5 sm:order-none sm:w-auto">
      <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={() => shift(-1)} aria-label={dict.shell.previousMonth}>
        <ChevronLeft size={18} />
      </Button>
      <span className="min-w-36 text-center text-sm font-semibold">{month ? format.month(month) : "\u00a0"}</span>
      <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={() => shift(1)} disabled={isCurrent} aria-label={dict.shell.nextMonth}>
        <ChevronRight size={18} />
      </Button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { locale, dict } = useI18n();
  const pathname = usePathname();
  const active = activeNavItem(pathname, locale);
  const [openDialog, setOpenDialog] = useState<"transaction" | "data" | null>(null);
  const closeDialog = () => setOpenDialog(null);

  return (
    <MonthProvider>
      <div className="grid min-h-screen md:grid-cols-[232px_minmax(0,1fr)]">
        <Sidebar activeSegment={active?.segment} />
        <div className="min-w-0">
          <header className="sticky top-0 z-10 flex flex-wrap items-center gap-4 border-b bg-bg/85 px-4 py-3 backdrop-blur-md md:px-8">
            <h1 className="flex-1 text-[22px] font-bold">{active ? dict.nav[active.labelKey] : dict.meta.appName}</h1>
            {active?.usesMonth ? <MonthPicker /> : null}
            <div className="flex gap-1.5">
              <Button variant="ghost" size="icon" onClick={() => setOpenDialog("data")} title={dict.shell.manageData} aria-label={dict.shell.manageData}>
                <Database size={18} />
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleTheme} title={dict.shell.toggleTheme} aria-label={dict.shell.toggleTheme}>
                <SunMoon size={18} />
              </Button>
              <Button variant="primary" onClick={() => setOpenDialog("transaction")} aria-label={dict.shell.addTransaction}>
                <Plus size={16} aria-hidden />
                <span className="max-sm:hidden">{dict.shell.addTransaction}</span>
              </Button>
            </div>
          </header>
          <main className="max-w-7xl px-4 pt-6 pb-28 md:px-8 md:pb-12">{children}</main>
        </div>
      </div>
      <TransactionFormDialog open={openDialog === "transaction"} onClose={closeDialog} />
      <DataDialog open={openDialog === "data"} onClose={closeDialog} />
    </MonthProvider>
  );
}
