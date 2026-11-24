import type { ReactNode } from "react";
import type { BudgetStatus } from "@/lib/domain/budgets";
import { cn } from "@/lib/utils";
import { Card } from "./card";

export function ColorDot({ color, className }: { color: string; className?: string }) {
  return <span className={cn("inline-block size-2.5 shrink-0 rounded-full", className)} style={{ background: color }} />;
}

const KPI_TONES = { neutral: "", positive: "text-success", negative: "text-danger" } as const;

export function Kpi({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: keyof typeof KPI_TONES;
}) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-[13px] font-medium text-muted">{label}</span>
      <strong className={cn("text-2xl font-bold tracking-tight tabular-nums", KPI_TONES[tone])}>{value}</strong>
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </Card>
  );
}

export function KpiGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">{children}</div>;
}

const STATUS_COLOR: Record<BudgetStatus, string> = {
  ok: "var(--color-success)",
  warning: "var(--color-warning)",
  over: "var(--color-danger)",
};

/** `ratio` may exceed 1; the bar caps at full. `marker` (0–1) draws an expected-pace tick. */
export function Progress({
  ratio,
  status = "ok",
  color,
  marker,
  valueText,
  label,
}: {
  ratio: number;
  status?: BudgetStatus;
  color?: string;
  marker?: number;
  valueText?: string;
  label: string;
}) {
  const percent = Math.round(ratio * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={valueText}
      className="relative h-2 rounded-full bg-surface-2"
    >
      <span
        className="block h-full rounded-full transition-[width] duration-400"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%`, background: color ?? STATUS_COLOR[status] }}
      />
      {marker !== undefined ? (
        <span aria-hidden className="absolute -inset-y-1 w-0.5 rounded-sm bg-fg opacity-35" style={{ left: `${Math.min(100, marker * 100)}%` }} />
      ) : null}
    </div>
  );
}

const BADGE_TONES = {
  neutral: "bg-surface-2 text-muted",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
} as const;

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof BADGE_TONES; children: ReactNode }) {
  return (
    <span className={cn("inline-block rounded-full px-2 py-0.5 text-xs font-semibold", BADGE_TONES[tone])}>
      {children}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-muted">{children}</p>;
}

export interface LegendItem {
  label: string;
  color: string;
  value?: string;
  note?: string;
}

export function Legend({ items, inline = false }: { items: LegendItem[]; inline?: boolean }) {
  return (
    <ul className={cn("flex text-sm", inline ? "mt-3 flex-row flex-wrap gap-4" : "flex-col gap-2")}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <ColorDot color={item.color} />
          <span className={cn("min-w-0 truncate", !inline && "flex-1")}>{item.label}</span>
          {item.value ? (
            <strong className="tabular-nums">
              {item.value}
              {item.note ? <small className="ml-1.5 font-medium text-muted">{item.note}</small> : null}
            </strong>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
