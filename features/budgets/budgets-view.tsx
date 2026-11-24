"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useMonth } from "@/components/layout/month-context";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ColorDot, EmptyState, Kpi, KpiGrid, Progress } from "@/components/ui/indicators";
import { ViewSkeleton } from "@/components/ui/view-skeleton";
import { useI18n } from "@/i18n/i18n-provider";
import { budgetRows, daysLeftInMonth, monthPace, type BudgetRow } from "@/lib/domain/budgets";
import { currentMonth } from "@/lib/domain/dates";
import { categoriesOfType, categoryOrPlaceholder, spendingByCategory } from "@/lib/domain/selectors";
import { sum } from "@/lib/domain/sum";
import type { MonthKey } from "@/lib/domain/types";
import { useAppData } from "@/lib/store/use-app-data";
import { BudgetFormDialog } from "./budget-form-dialog";

/** Editing: a category id, `"new"` for the add flow, or `null` when closed. */
type Editing = string | "new" | null;

function DailyAllowance({ month, remaining }: { month: MonthKey; remaining: number }) {
  const { dict, format } = useI18n();
  const text = dict.budgets;
  const daysLeft = daysLeftInMonth(month);
  if (daysLeft === null) {
    return <Kpi label={text.dailyAllowance} value="—" hint={month < currentMonth() ? text.monthClosed : text.monthNotStarted} />;
  }
  return (
    <Kpi
      label={text.dailyAllowance}
      value={format.money(Math.max(0, remaining) / daysLeft)}
      hint={format.plural(text.daysLeft, daysLeft)}
    />
  );
}

function BudgetRowItem({ row, name, color, pace, onEdit }: { row: BudgetRow; name: string; color: string; pace: number; onEdit: () => void }) {
  const { dict, format } = useI18n();
  const text = dict.budgets;
  return (
    <li className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <ColorDot color={color} />
        <strong className="min-w-0 flex-1 truncate">{name}</strong>
        <Button size="sm" variant="ghost" onClick={onEdit}>
          {dict.common.edit}
        </Button>
      </div>
      <p className="text-sm text-muted tabular-nums">
        {format.money(row.spent)} / {format.money(row.limit)}
      </p>
      <Progress
        label={name}
        ratio={row.ratio}
        status={row.status}
        marker={pace > 0 && pace < 1 ? pace : undefined}
        valueText={pace > 0 && pace < 1 ? format.message(text.paceValue, { spent: format.percent(row.ratio), pace: format.percent(pace) }) : undefined}
      />
      <div className="flex justify-between text-[13px] text-muted">
        {row.remaining < 0 ? (
          <span className="text-danger">{format.message(text.overBy, { amount: format.money(-row.remaining) })}</span>
        ) : (
          <span>{format.message(text.left, { amount: format.money(row.remaining) })}</span>
        )}
        <span>{format.percent(row.ratio)}</span>
      </div>
    </li>
  );
}

export function BudgetsView() {
  const data = useAppData();
  const { month } = useMonth();
  const { dict, format } = useI18n();
  const text = dict.budgets;
  const [editing, setEditing] = useState<Editing>(null);

  if (!data || !month) return <ViewSkeleton />;

  const rows = budgetRows(data, month);
  const budgeted = sum(rows, (r) => r.limit);
  const spent = sum(rows, (r) => r.spent);
  const remaining = budgeted - spent;
  const pace = monthPace(month);
  const unbudgeted = spendingByCategory(data, month).filter((s) => !(s.categoryId in data.budgets));
  const canAdd = categoriesOfType(data, "expense").some((c) => !(c.id in data.budgets));
  const category = (id: string) => categoryOrPlaceholder(data, id, dict.common.uncategorized);

  return (
    <section className="flex animate-fade-in flex-col gap-5">
      <KpiGrid>
        <Kpi label={text.budgeted} value={format.money(budgeted)} hint={format.plural(text.categoryCount, rows.length)} />
        <Kpi label={text.spent} value={format.money(spent)} hint={format.message(text.ofBudget, { percent: format.percent(budgeted ? spent / budgeted : 0) })} />
        <Kpi
          label={remaining >= 0 ? text.remaining : text.overBudget}
          value={format.money(Math.abs(remaining))}
          tone={remaining >= 0 ? "positive" : "negative"}
        />
        <DailyAllowance month={month} remaining={remaining} />
      </KpiGrid>

      <Card data-tour="budget-list">
        <CardHeader
          title={text.title}
          action={
            <Button data-tour="budget-add" size="sm" variant="primary" disabled={!canAdd} onClick={() => setEditing("new")}>
              <Plus size={14} aria-hidden />
              {text.add}
            </Button>
          }
        />
        {rows.length ? (
          <ul className="flex flex-col gap-5">
            {rows.map((row) => (
              <BudgetRowItem
                key={row.categoryId}
                row={row}
                name={category(row.categoryId).name}
                color={category(row.categoryId).color}
                pace={pace}
                onEdit={() => setEditing(row.categoryId)}
              />
            ))}
          </ul>
        ) : (
          <EmptyState>{text.empty}</EmptyState>
        )}
      </Card>

      {unbudgeted.length ? (
        <Card>
          <CardHeader title={text.unbudgeted} />
          <ul className="flex flex-col gap-3">
            {unbudgeted.map(({ categoryId, amount }) => (
              <li key={categoryId} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <ColorDot color={category(categoryId).color} />
                  <span className="min-w-0 flex-1 truncate">{category(categoryId).name}</span>
                  <span className="font-semibold tabular-nums">{format.money(amount)}</span>
                </div>
                <Button size="sm" variant="ghost" className="self-start sm:self-auto" onClick={() => setEditing(categoryId)}>
                  {text.setBudget}
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <BudgetFormDialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        categoryId={editing === "new" ? undefined : (editing ?? undefined)}
      />
    </section>
  );
}
