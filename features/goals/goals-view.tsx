"use client";

import { useState } from "react";
import { Badge, Kpi, KpiGrid, Progress } from "@/components/ui/indicators";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ViewSkeleton } from "@/components/ui/view-skeleton";
import { useI18n } from "@/i18n/i18n-provider";
import { goalProgress } from "@/lib/domain/finance";
import { sum } from "@/lib/domain/sum";
import type { Goal } from "@/lib/domain/types";
import { useAppData } from "@/lib/store/use-app-data";
import { ContributionDialog, GoalFormDialog } from "./goal-dialogs";

type Dialogs = { kind: "edit"; goal?: Goal } | { kind: "contribute"; goal: Goal } | null;

function GoalCard({ goal, onEdit, onContribute }: { goal: Goal; onEdit: () => void; onContribute: () => void }) {
  const { dict, format } = useI18n();
  const text = dict.goals;
  const progress = goalProgress(goal);

  return (
    <Card className="flex flex-col gap-3 border-t-4" style={{ borderTopColor: goal.color }}>
      <div className="flex items-center gap-2">
        <strong className="flex-1 truncate">{goal.name}</strong>
        <Badge>{format.message(text.by, { date: format.date(goal.deadline, { month: "short", year: "numeric" }) })}</Badge>
      </div>
      <div>
        <div className="text-[26px] font-bold tabular-nums">{format.money(goal.saved)}</div>
        <div className="text-muted">
          {format.message(text.progress, { amount: format.money(goal.target), percent: format.percent(progress.ratio) })}
        </div>
      </div>
      <Progress ratio={progress.ratio} color={goal.color} />
      <div className="text-sm">
        {progress.done ? (
          <Badge tone="success">{text.reached}</Badge>
        ) : progress.monthsLeft < 0 ? (
          <Badge tone="danger">{text.deadlinePassed}</Badge>
        ) : (
          <span className="text-muted">{format.message(text.saveMonthly, { amount: format.money(progress.monthlyNeeded) })}</span>
        )}
      </div>
      <div className="mt-auto flex gap-2">
        <Button size="sm" variant="primary" onClick={onContribute}>
          {text.addMoney}
        </Button>
        <Button size="sm" variant="ghost" onClick={onEdit}>
          {dict.common.edit}
        </Button>
      </div>
    </Card>
  );
}

export function GoalsView() {
  const data = useAppData();
  const { dict, format } = useI18n();
  const text = dict.goals;
  const [dialog, setDialog] = useState<Dialogs>(null);

  if (!data) return <ViewSkeleton />;

  const saved = sum(data.goals, (g) => g.saved);
  const target = sum(data.goals, (g) => g.target);
  const monthlyNeeded = sum(data.goals, (g) => goalProgress(g).monthlyNeeded);
  const close = () => setDialog(null);

  return (
    <section className="flex animate-fade-in flex-col gap-5">
      <KpiGrid>
        <Kpi label={text.savedSoFar} value={format.money(saved)} tone="positive" />
        <Kpi label={text.totalTargets} value={format.money(target)} hint={format.message(text.complete, { percent: format.percent(target ? saved / target : 0) })} />
        <Kpi label={text.neededPerMonth} value={format.money(monthlyNeeded)} hint={text.neededHint} />
      </KpiGrid>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {data.goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onEdit={() => setDialog({ kind: "edit", goal })}
            onContribute={() => setDialog({ kind: "contribute", goal })}
          />
        ))}
        <button
          type="button"
          onClick={() => setDialog({ kind: "edit" })}
          className="grid min-h-56 cursor-pointer place-items-center rounded-2xl border-2 border-dashed font-semibold text-muted hover:border-primary hover:text-primary"
        >
          + {text.new}
        </button>
      </div>
      <GoalFormDialog open={dialog?.kind === "edit"} goal={dialog?.goal} onClose={close} />
      <ContributionDialog open={dialog?.kind === "contribute"} goal={dialog?.goal} onClose={close} />
    </section>
  );
}
