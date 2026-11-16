"use client";

import { useState, type ReactNode } from "react";
import { LineChart } from "@/components/charts/line-chart";
import { Card, CardHeader } from "@/components/ui/card";
import { Legend, Progress } from "@/components/ui/indicators";
import { Field, Input } from "@/components/ui/input";
import { ViewSkeleton } from "@/components/ui/view-skeleton";
import { useI18n } from "@/i18n/i18n-provider";
import { compoundGrowth, emergencyFund, loanPayment } from "@/lib/domain/finance";
import { averageMonthlyExpenses } from "@/lib/domain/selectors";
import { useAppData } from "@/lib/store/use-app-data";

type Values<K extends string> = Record<K, string>;

/** Number inputs kept as strings so partially typed values ("1,", "") don't jump. */
function useNumbers<K extends string>(initial: Values<K>) {
  const [values, setValues] = useState(initial);
  const numbers = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, Number(v) || 0])) as Record<K, number>;
  const input = (key: K, label: string, step = "any") => (
    <Field label={label}>
      <Input type="number" inputMode="decimal" min="0" step={step} value={values[key]} onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))} />
    </Field>
  );
  return { numbers, input };
}

function Stats({ items }: { items: [string, string][] }) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 [&>*:last-child:nth-child(odd)]:col-span-2 sm:[&>*:last-child:nth-child(odd)]:col-span-1">
      {items.map(([label, value]) => (
        <div key={label} className="flex flex-col rounded-[10px] bg-surface-2 px-3.5 py-3">
          <span className="text-xs text-muted">{label}</span>
          <strong className="text-lg tabular-nums">{value}</strong>
        </div>
      ))}
    </div>
  );
}

function Calculator({ title, description, form, children, className }: { title: string; description: string; form: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader title={title} />
      <p className="text-muted">{description}</p>
      <form className="my-4 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3" onSubmit={(e) => e.preventDefault()}>
        {form}
      </form>
      {children}
    </Card>
  );
}

function CompoundInterest() {
  const { dict, format } = useI18n();
  const text = dict.calculators.compound;
  const { numbers, input } = useNumbers({ principal: "5000", monthly: "200", rate: "6", years: "20" });
  const result = compoundGrowth(numbers);
  const series = [
    { name: text.balance, color: "var(--color-primary)", values: result.points.map((p) => p.balance) },
    { name: text.contributed, color: "var(--color-muted)", values: result.points.map((p) => p.contributed) },
  ];

  return (
    <Calculator
      className="lg:col-span-2"
      title={text.title}
      description={text.description}
      form={
        <>
          {input("principal", text.principal)}
          {input("monthly", text.monthly)}
          {input("rate", text.rate, "0.1")}
          {input("years", text.years, "1")}
        </>
      }
    >
      <Stats
        items={[
          [text.final, format.money(result.balance)],
          [text.contributed, format.money(result.contributed)],
          [text.interest, format.money(result.interest)],
        ]}
      />
      <LineChart label={text.title} labels={result.points.map((p) => format.message(text.yearShort, { year: p.year }))} series={series} />
      <Legend inline items={series.map((s) => ({ label: s.name, color: s.color }))} />
    </Calculator>
  );
}

function LoanPayment() {
  const { dict, format } = useI18n();
  const text = dict.calculators.loan;
  const { numbers, input } = useNumbers({ amount: "15000", rate: "5.5", years: "5" });
  const result = loanPayment(numbers);
  const principalShare = result.total ? numbers.amount / result.total : 0;

  return (
    <Calculator
      title={text.title}
      description={text.description}
      form={
        <>
          {input("amount", text.amount)}
          {input("rate", text.rate, "0.1")}
          {input("years", text.years, "1")}
        </>
      }
    >
      <Stats
        items={[
          [text.payment, format.money(result.payment)],
          [text.interest, format.money(result.interest)],
          [text.total, format.money(result.total)],
        ]}
      />
      <Progress label={text.title} ratio={principalShare} color="var(--color-primary)" />
      <div className="mt-2 flex justify-between text-[13px] text-muted">
        <span>{format.message(text.principalShare, { percent: format.percent(principalShare) })}</span>
        <span>{format.message(text.interestShare, { percent: format.percent(1 - principalShare) })}</span>
      </div>
    </Calculator>
  );
}

function EmergencyFund({ averageExpenses }: { averageExpenses: number }) {
  const { dict, format } = useI18n();
  const text = dict.calculators.emergency;
  const { numbers, input } = useNumbers({ expenses: String(Math.round(averageExpenses)), months: "6", saved: "0" });
  const result = emergencyFund(numbers);

  return (
    <Calculator
      title={text.title}
      description={text.description}
      form={
        <>
          {input("expenses", text.expenses)}
          {input("months", text.months, "1")}
          {input("saved", text.saved)}
        </>
      }
    >
      <Stats
        items={[
          [text.target, format.money(result.target)],
          [text.gap, format.money(result.gap)],
          [text.covered, format.decimal(result.monthsCovered)],
        ]}
      />
      <Progress label={text.title} ratio={result.ratio} status={result.ratio >= 1 ? "ok" : result.ratio >= 0.5 ? "warning" : "over"} />
      <div className="mt-2 flex justify-between text-[13px] text-muted">
        <span>{format.message(text.funded, { percent: format.percent(result.ratio) })}</span>
        <span>{text.advice}</span>
      </div>
    </Calculator>
  );
}

export function CalculatorsView() {
  const data = useAppData();
  if (!data) return <ViewSkeleton />;

  return (
    <section className="grid animate-fade-in gap-5 lg:grid-cols-2">
      <CompoundInterest />
      <LoanPayment />
      <EmergencyFund averageExpenses={averageMonthlyExpenses(data, 3)} />
    </section>
  );
}
