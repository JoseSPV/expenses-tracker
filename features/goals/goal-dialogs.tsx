"use client";

import { useState } from "react";
import { Dialog, DialogForm } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/i18n/i18n-provider";
import { addMonths, currentMonth } from "@/lib/domain/dates";
import { parseMoney } from "@/lib/domain/money";
import { nextPaletteColor } from "@/lib/domain/palette";
import type { Goal } from "@/lib/domain/types";
import { contributeToGoal, deleteGoal, saveGoal } from "@/lib/store/actions";
import { useAppData } from "@/lib/store/use-app-data";

export function GoalFormDialog({ open, goal, onClose }: { open: boolean; goal?: Goal; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <GoalForm goal={goal} onClose={onClose} />
    </Dialog>
  );
}

function GoalForm({ goal, onClose }: { goal?: Goal; onClose: () => void }) {
  const { dict } = useI18n();
  const toast = useToast();
  const data = useAppData();
  const text = dict.goals;
  const [name, setName] = useState(goal?.name ?? "");
  const [target, setTarget] = useState(goal ? String(goal.target) : "");
  const [saved, setSaved] = useState(goal ? String(goal.saved) : "0");
  const [deadline, setDeadline] = useState(goal?.deadline ?? `${addMonths(currentMonth(), 12)}-01`);
  const [color, setColor] = useState(goal?.color ?? nextPaletteColor(data?.goals.map((item) => item.color) ?? []));
  const parsedTarget = parseMoney(target);
  const parsedSaved = parseMoney(saved);

  const submit = () => {
    if (!name.trim() || parsedTarget === null || parsedTarget <= 0 || parsedSaved === null || !saveGoal({ name: name.trim(), target: parsedTarget, saved: parsedSaved, deadline, color }, goal?.id)) {
      toast(dict.common.notSaved);
      return;
    }
    onClose();
  };

  return (
    <DialogForm
      title={goal ? text.editTitle : text.newTitle}
      submitLabel={goal ? dict.common.saveChanges : dict.common.save}
      onSubmit={submit}
      onCancel={onClose}
      submitDisabled={!name.trim() || parsedTarget === null || parsedTarget <= 0 || parsedSaved === null}
      onDelete={
        goal
          ? () => {
              deleteGoal(goal.id);
              onClose();
            }
          : undefined
      }
    >
      <Field label={dict.common.name}>
        <Input required data-autofocus placeholder={text.namePlaceholder} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label={text.target}>
        <Input type="number" inputMode="decimal" step="0.01" min="1" required value={target} onChange={(e) => setTarget(e.target.value)} />
      </Field>
      <Field label={text.alreadySaved}>
        <Input type="number" inputMode="decimal" step="0.01" min="0" required value={saved} onChange={(e) => setSaved(e.target.value)} />
      </Field>
      <Field label={text.deadline}>
        <Input type="date" required value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </Field>
      <Field label={dict.common.color}>
        <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
      </Field>
    </DialogForm>
  );
}

export function ContributionDialog({ open, goal, onClose }: { open: boolean; goal?: Goal; onClose: () => void }) {
  return <Dialog open={open} onClose={onClose}>{goal ? <ContributionForm goal={goal} onClose={onClose} /> : null}</Dialog>;
}

function ContributionForm({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const { dict, format } = useI18n();
  const toast = useToast();
  const text = dict.goals;
  const [amount, setAmount] = useState("");
  const parsed = parseMoney(amount, { allowNegative: true });

  const submit = () => {
    if (parsed === null || parsed === 0) {
      toast(dict.common.notSaved);
      return;
    }
    const applied = contributeToGoal(goal.id, parsed);
    onClose();
    if (applied > 0 && goal.saved < goal.target && goal.saved + applied >= goal.target) {
      toast(format.message(text.goalReached, { name: goal.name }));
    } else if (applied > 0) {
      toast(format.message(text.contributed, { amount: format.money(applied), name: goal.name }));
    } else if (applied < 0) {
      toast(format.message(text.withdrawn, { amount: format.money(-applied), name: goal.name }));
    }
  };

  return (
    <DialogForm title={format.message(text.contributeTitle, { name: goal.name })} submitLabel={dict.common.add} onSubmit={submit} onCancel={onClose} submitDisabled={parsed === null || parsed === 0}>
      <Field label={dict.common.amount} hint={text.contributeHint}>
        <Input type="number" inputMode="decimal" step="0.01" required data-autofocus value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>
    </DialogForm>
  );
}
