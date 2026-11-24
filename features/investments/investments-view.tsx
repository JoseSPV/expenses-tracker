"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/indicators";
import { ViewSkeleton } from "@/components/ui/view-skeleton";
import { useI18n } from "@/i18n/i18n-provider";
import { cn } from "@/lib/utils";
import { useAppData } from "@/lib/store/use-app-data";
import { InstrumentFormDialog } from "./instrument-form-dialog";
import { OperationFormDialog } from "./operation-form-dialog";
import { PortfolioPanel } from "./portfolio-panel";
import { YearPanel } from "./year-panel";

export type InvestmentsTab = "portfolio" | "year";

export function InvestmentsView({ tab, year }: { tab: InvestmentsTab; year?: number }) {
  const data = useAppData();
  const { dict, locale } = useI18n();
  const text = dict.investments;
  const [dialog, setDialog] = useState<"instrument" | "operation" | null>(null);

  if (!data) return <ViewSkeleton />;

  const base = `/${locale}/investments`;
  const tabs: { id: InvestmentsTab; label: string; href: string }[] = [
    { id: "portfolio", label: text.portfolioTab, href: base },
    { id: "year", label: text.yearTab, href: `${base}?view=year` },
  ];
  const hasInstruments = data.instruments.length > 0;

  return (
    <section className="flex animate-fade-in flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label={text.viewsLabel} className="flex gap-1 rounded-[12px] border bg-surface p-1">
          {tabs.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              aria-current={item.id === tab ? "page" : undefined}
              className={cn(
                "flex min-h-9 items-center rounded-[9px] px-3.5 text-sm font-semibold text-muted hover:text-fg",
                item.id === tab && "bg-primary/13 text-primary hover:text-primary",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setDialog("instrument")}>
            <Plus size={16} aria-hidden />
            {text.addInstrument}
          </Button>
          <Button variant="primary" disabled={!hasInstruments} title={hasInstruments ? undefined : text.needInstrument} onClick={() => setDialog("operation")}>
            <Plus size={16} aria-hidden />
            {text.addOperation}
          </Button>
        </div>
      </div>

      {!hasInstruments ? (
        <Card>
          <EmptyState>{text.empty}</EmptyState>
        </Card>
      ) : tab === "year" ? (
        <YearPanel data={data} year={year} />
      ) : (
        <PortfolioPanel data={data} />
      )}

      <InstrumentFormDialog open={dialog === "instrument"} onClose={() => setDialog(null)} />
      <OperationFormDialog open={dialog === "operation"} instruments={data.instruments} onClose={() => setDialog(null)} />
    </section>
  );
}
