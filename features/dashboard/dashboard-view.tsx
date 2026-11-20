"use client";

import Link from "next/link";
import { BarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { useMonth } from "@/components/layout/month-context";
import { hrefFor } from "@/components/layout/navigation";
import { Card, CardHeader } from "@/components/ui/card";
import { ColorDot, EmptyState, Kpi, KpiGrid, Legend, Progress } from "@/components/ui/indicators";
import { ViewSkeleton } from "@/components/ui/view-skeleton";
import { useI18n } from "@/i18n/i18n-provider";
import { budgetRows } from "@/lib/domain/budgets";
import { goalProgress } from "@/lib/domain/finance";
import { categoryOrPlaceholder, monthlyTrend, spendingByCategory, totals, transactionsInMonth, typeOf, upcomingRecurring } from "@/lib/domain/selectors";
import type { AppData, MonthKey } from "@/lib/domain/types";
import { useAppData } from "@/lib/store/use-app-data";

function SeeAll({ segment }: { segment: string }) {
  const { locale, dict } = useI18n();
  return (
    <Link href={hrefFor(locale, segment)} className="text-sm text-primary hover:underline">
      {dict.dashboard.seeAll}
    </Link>
  );
}

function Spending({ data, month, total }: { data: AppData; month: MonthKey; total: number }) {
  const { dict, format } = useI18n();
  const spending = spendingByCategory(data, month).map((s) => ({
    ...s,
    category: categoryOrPlaceholder(data, s.categoryId, dict.common.uncategorized),
  }));
  if (!spending.length) return <EmptyState>{dict.dashboard.noExpenses}</EmptyState>;

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[200px_minmax(0,1fr)]">
      <DonutChart
        label={dict.dashboard.spent}
        value={format.money(total)}
        segments={spending.map((s) => ({ label: s.category.name, value: s.amount, color: s.category.color }))}
      />
      <Legend
        items={spending.map((s) => ({
          label: s.category.name,
          color: s.category.color,
          value: format.money(s.amount),
          note: format.percent(s.amount / total),
        }))}
      />
    </div>
  );
}

function Trend({ data, month }: { data: AppData; month: MonthKey }) {
  const { dict, format } = useI18n();
  const trend = monthlyTrend(data, month, 6);
  if (trend.every((point) => point.income === 0 && point.expense === 0)) return <EmptyState>{dict.dashboard.noTrend}</EmptyState>;

  const series = [
    { name: dict.dashboard.income, color: "var(--color-success)", values: trend.map((t) => t.income) },
    { name: dict.dashboard.expenses, color: "var(--color-danger)", values: trend.map((t) => t.expense) },
  ];
  return (
    <>
      <BarChart label={dict.dashboard.incomeVsExpenses} labels={trend.map((t) => format.shortMonth(t.month))} series={series} />
      <Legend inline items={series.map((s) => ({ label: s.name, color: s.color }))} />
    </>
  );
}

function BudgetSummary({ data, month }: { data: AppData; month: MonthKey }) {
  const { dict, format } = useI18n();
  const rows = budgetRows(data, month).slice(0, 5);
  if (!rows.length) return <EmptyState>{dict.dashboard.noBudgets}</EmptyState>;

  return (
    <ul className="flex flex-col gap-4">
      {rows.map((row) => {
        const category = categoryOrPlaceholder(data, row.categoryId, dict.common.uncategorized);
        return (
          <li key={row.categoryId} className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <ColorDot color={category.color} />
              <span className="min-w-0 flex-1 truncate">{category.name}</span>
              <span className="shrink-0 text-sm text-muted tabular-nums">
                {format.money(row.spent)} / {format.money(row.limit)}
              </span>
            </div>
            <Progress label={category.name} ratio={row.ratio} status={row.status} />
          </li>
        );
      })}
    </ul>
  );
}

function UpcomingBills({ data }: { data: AppData }) {
  const { dict, format } = useI18n();
  const items = upcomingRecurring(data, 30).slice(0, 5);
  if (!items.length) return <EmptyState>{dict.dashboard.noUpcoming}</EmptyState>;

  return (
    <ul className="flex flex-col gap-4">
      {items.map((item) => {
        const income = typeOf(data, item) === "income";
        return (
          <li key={item.id} className="flex items-center gap-2.5">
            <ColorDot color={categoryOrPlaceholder(data, item.categoryId, dict.common.uncategorized).color} />
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate font-semibold">{item.name}</strong>
              <small className="text-[13px] text-muted">{format.dueIn(item.nextDate)}</small>
            </span>
            <span className={`font-semibold tabular-nums ${income ? "text-success" : ""}`}>
              {income ? "+" : ""}
              {format.money(item.amount)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function GoalSummary({ data }: { data: AppData }) {
  const { dict, format } = useI18n();
  const goals = data.goals.slice(0, 3);
  if (!goals.length) return <EmptyState>{dict.dashboard.noGoals}</EmptyState>;

  return (
    <ul className="flex flex-col gap-4">
      {goals.map((goal) => {
        const { ratio } = goalProgress(goal);
        return (
          <li key={goal.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <strong className="truncate">{goal.name}</strong>
              <span className="text-muted">{format.percent(ratio)}</span>
            </div>
            <Progress label={goal.name} ratio={ratio} color={goal.color} />
            <div className="flex flex-wrap justify-between gap-x-3 text-[13px] text-muted">
              <span>{format.message(dict.dashboard.goalSaved, { amount: format.money(goal.saved) })}</span>
              <span>{format.message(dict.dashboard.goalTarget, { amount: format.money(goal.target) })}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function DashboardView() {
  const data = useAppData();
  const { month } = useMonth();
  const { dict, format } = useI18n();
  const text = dict.dashboard;

  if (!data || !month) return <ViewSkeleton />;

  const summary = totals(data, transactionsInMonth(data, month));

  return (
    <section className="flex animate-fade-in flex-col gap-5">
      <div data-tour="summary-totals">
      <KpiGrid>
        <Kpi label={text.income} value={format.money(summary.income)} tone="positive" />
        <Kpi label={text.expenses} value={format.money(summary.expense)} />
        <Kpi label={text.net} value={format.money(summary.net)} tone={summary.net >= 0 ? "positive" : "negative"} />
        <Kpi label={text.savingsRate} value={summary.income > 0 ? format.percent(summary.savingsRate) : "—"} hint={text.savingsRateHint} />
      </KpiGrid>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card data-tour="summary-spending">
          <CardHeader title={text.whereMoneyGoes} action={<SeeAll segment="transactions" />} />
          <Spending data={data} month={month} total={summary.expense} />
        </Card>
        <Card>
          <CardHeader title={text.incomeVsExpenses} />
          <Trend data={data} month={month} />
        </Card>
      </div>
      <div data-tour="summary-rest" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader title={text.budgets} action={<SeeAll segment="budgets" />} />
          <BudgetSummary data={data} month={month} />
        </Card>
        <Card>
          <CardHeader title={text.upcomingBills} action={<SeeAll segment="bills" />} />
          <UpcomingBills data={data} />
        </Card>
        <Card>
          <CardHeader title={text.goals} action={<SeeAll segment="goals" />} />
          <GoalSummary data={data} />
        </Card>
      </div>
    </section>
  );
}
