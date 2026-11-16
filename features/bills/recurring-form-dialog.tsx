"use client";

import { useState } from "react";
import { Dialog, DialogForm } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { CategorySelect } from "@/features/categories/category-select";
import { useI18n } from "@/i18n/i18n-provider";
import { today } from "@/lib/domain/dates";
import { parseMoney } from "@/lib/domain/money";
import type { AppData, Frequency, RecurringItem } from "@/lib/domain/types";
import { deleteRecurring, saveRecurring } from "@/lib/store/actions";
import { useAppData } from "@/lib/store/use-app-data";

const FREQUENCIES: Frequency[] = ["weekly", "monthly", "yearly"];

export function RecurringFormDialog({ open, item, onClose }: { open: boolean; item?: RecurringItem; onClose: () => void }) {
  const data = useAppData();
  return (
    <Dialog open={open} onClose={onClose}>
      {data ? <RecurringForm data={data} item={item} onClose={onClose} /> : null}
    </Dialog>
  );
}

function RecurringForm({ data, item, onClose }: { data: AppData; item?: RecurringItem; onClose: () => void }) {
  const { dict } = useI18n();
  const toast = useToast();
  const text = dict.bills;
  const [name, setName] = useState(item?.name ?? "");
  const [amount, setAmount] = useState(item ? String(item.amount) : "");
  const [frequency, setFrequency] = useState<Frequency>(item?.frequency ?? "monthly");
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? data.categories.find((c) => c.type === "expense")?.id ?? "");
  const [nextDate, setNextDate] = useState(item?.nextDate ?? today());
  const parsed = parseMoney(amount);

  const submit = () => {
    if (!name.trim() || parsed === null || parsed <= 0 || !saveRecurring({ name: name.trim(), amount: parsed, frequency, categoryId, nextDate }, item?.id)) {
      toast(dict.common.notSaved);
      return;
    }
    onClose();
  };

  return (
    <DialogForm
      title={item ? text.editTitle : text.newTitle}
      submitLabel={item ? dict.common.saveChanges : dict.common.save}
      onSubmit={submit}
      onCancel={onClose}
      submitDisabled={!name.trim() || !categoryId || parsed === null || parsed <= 0}
      onDelete={
        item
          ? () => {
              deleteRecurring(item.id);
              onClose();
            }
          : undefined
      }
    >
      <Field label={dict.common.name}>
        <Input required data-autofocus placeholder={text.namePlaceholder} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label={dict.common.amount}>
        <Input type="number" inputMode="decimal" step="0.01" min="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>
      <Field label={text.frequency}>
        <Select value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
          {FREQUENCIES.map((f) => (
            <option key={f} value={f}>
              {text.frequencies[f]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={dict.common.category}>
        <CategorySelect data={data} value={categoryId} onChange={setCategoryId} required />
      </Field>
      <Field label={text.nextDueLabel}>
        <Input type="date" required value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
      </Field>
    </DialogForm>
  );
}
