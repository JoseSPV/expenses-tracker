"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge, ColorDot, EmptyState, Kpi, KpiGrid } from "@/components/ui/indicators";
import { useToast } from "@/components/ui/toast";
import { ViewSkeleton } from "@/components/ui/view-skeleton";
import { useI18n } from "@/i18n/i18n-provider";
import { daysBetween, today } from "@/lib/domain/dates";
import { toMonthly } from "@/lib/domain/finance";
import { categoryOrPlaceholder, typeOf, upcomingRecurring } from "@/lib/domain/selectors";
import { sum } from "@/lib/domain/sum";
import type { RecurringItem } from "@/lib/domain/types";
import { logRecurringPayment } from "@/lib/store/actions";
import { useAppData } from "@/lib/store/use-app-data";
import { RecurringFormDialog } from "./recurring-form-dialog";

type Editing = { item?: RecurringItem } | null;

function DueBadge({ date }: { date: string }) {
  const { format } = useI18n();
  const days = daysBetween(today(), date);
  return <Badge tone={days < 0 ? "danger" : days <= 3 ? "warning" : "neutral"}>{format.dueIn(date)}</Badge>;
}

export function BillsView() {
  const data = useAppData();
  const { dict, format } = useI18n();
  const toast = useToast();
  const text = dict.bills;
  const [editing, setEditing] = useState<Editing>(null);

  if (!data) return <ViewSkeleton />;

  const items = [...data.recurring].sort((a, b) => a.nextDate.localeCompare(b.nextDate));
  const isIncome = (item: RecurringItem) => typeOf(data, item) === "income";
  const monthly = (list: RecurringItem[]) => sum(list, (r) => toMonthly(r.amount, r.frequency));
  const monthlyCost = monthly(items.filter((r) => !isIncome(r)));
  const monthlyIncome = monthly(items.filter(isIncome));
  const dueSoon = upcomingRecurring(data, 30).filter((r) => !isIncome(r));

  const logPayment = (item: RecurringItem) => {
    const updated = logRecurringPayment(item.id);
    if (updated) toast(format.message(text.logged, { name: item.name, date: format.date(updated.nextDate) }));
  };

  return (
    <section className="flex animate-fade-in flex-col gap-5">
      <KpiGrid>
        <Kpi label={text.fixedCosts} value={format.money(monthlyCost)} hint={text.fixedCostsHint} />
        <Kpi label={text.recurringIncome} value={format.money(monthlyIncome)} tone="positive" />
        <Kpi label={text.committed} value={format.percent(monthlyIncome ? monthlyCost / monthlyIncome : 0)} hint={text.committedHint} />
        <Kpi label={text.dueSoon} value={format.money(sum(dueSoon, (r) => r.amount))} hint={format.plural(text.dueSoonHint, dueSoon.length)} />
      </KpiGrid>

      <Card>
        <CardHeader
          title={text.items}
          action={
            <Button size="sm" variant="primary" onClick={() => setEditing({})}>
              <Plus size={14} aria-hidden />
              {text.add}
            </Button>
          }
        />
        {items.length === 0 ? (
          <EmptyState>{text.empty}</EmptyState>
        ) : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold tracking-wide text-muted uppercase [&>th]:border-b [&>th]:px-3 [&>th]:py-2">
                  <th>{dict.common.name}</th>
                  <th>{text.frequency}</th>
                  <th className="text-right">{text.amount}</th>
                  <th className="text-right">{text.perMonth}</th>
                  <th>{text.nextDue}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const category = categoryOrPlaceholder(data, item.categoryId, dict.common.uncategorized);
                  const income = isIncome(item);
                  return (
                    <tr key={item.id} className="whitespace-nowrap [&>td]:border-b [&>td]:px-3 [&>td]:py-3 last:[&>td]:border-b-0">
                      <td>
                        <div className="flex items-center gap-2.5">
                          <ColorDot color={category.color} />
                          <span className="flex flex-col">
                            <strong className="font-semibold">{item.name}</strong>
                            <small className="text-[13px] text-muted">{category.name}</small>
                          </span>
                        </div>
                      </td>
                      <td>{text.frequencies[item.frequency]}</td>
                      <td className={`text-right font-semibold tabular-nums ${income ? "text-success" : ""}`}>
                        {income ? "+" : ""}
                        {format.money(item.amount)}
                      </td>
                      <td className="text-right text-muted tabular-nums">{format.money(toMonthly(item.amount, item.frequency))}</td>
                      <td>
                        <span className="mr-2">{format.date(item.nextDate)}</span>
                        <DueBadge date={item.nextDate} />
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <Button size="sm" onClick={() => logPayment(item)}>
                            {income ? text.markReceived : text.markPaid}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditing({ item })}>
                            {dict.common.edit}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <RecurringFormDialog open={editing !== null} item={editing?.item} onClose={() => setEditing(null)} />
    </section>
  );
}
