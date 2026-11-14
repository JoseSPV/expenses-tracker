"use client";

import { useState } from "react";
import { Dialog, DialogForm } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/indicators";
import { Field, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { CategorySelect } from "@/features/categories/category-select";
import { useI18n } from "@/i18n/i18n-provider";
import { budgetStatus } from "@/lib/domain/budgets";
import { monthKey, today } from "@/lib/domain/dates";
import { spendingByCategory } from "@/lib/domain/selectors";
import type { AppData, Transaction } from "@/lib/domain/types";
import { deleteTransaction, saveTransaction } from "@/lib/store/actions";
import { useAppData } from "@/lib/store/use-app-data";

interface TransactionFormDialogProps {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction;
}

export function TransactionFormDialog({ open, onClose, transaction }: TransactionFormDialogProps) {
  const data = useAppData();
  return (
    <Dialog open={open} onClose={onClose}>
      {data ? <TransactionForm data={data} transaction={transaction} onClose={onClose} /> : null}
    </Dialog>
  );
}

/** Spent this month in the selected category, including the amount being typed. */
function BudgetHint({ data, categoryId, date, pending }: { data: AppData; categoryId: string; date: string; pending: number }) {
  const { format, dict } = useI18n();
  const limit = data.budgets[categoryId];
  if (!limit || !date) return null;

  const saved = spendingByCategory(data, monthKey(date)).find((s) => s.categoryId === categoryId)?.amount ?? 0;
  const spent = saved + pending;
  return (
    <div className="flex flex-col gap-1.5 text-[13px] text-muted">
      <span>{format.message(dict.transactions.budgetHint, { spent: format.money(spent), limit: format.money(limit) })}</span>
      <Progress ratio={spent / limit} status={budgetStatus(spent / limit)} />
    </div>
  );
}

function TransactionForm({ data, transaction, onClose }: { data: AppData; transaction?: Transaction; onClose: () => void }) {
  const { dict } = useI18n();
  const toast = useToast();
  const text = dict.transactions;
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : "");
  const [categoryId, setCategoryId] = useState(
    transaction?.categoryId ?? data.categories.find((c) => c.type === "expense")?.id ?? data.categories[0]?.id ?? "",
  );
  const [date, setDate] = useState(transaction?.date ?? today());
  const [note, setNote] = useState(transaction?.note ?? "");
  const alreadyCounted =
    transaction && transaction.categoryId === categoryId && monthKey(transaction.date) === monthKey(date) ? transaction.amount : 0;
  const pending = (Number(amount) > 0 ? Number(amount) : 0) - alreadyCounted;

  const submit = () => {
    saveTransaction({ amount: Number(amount), categoryId, date, note: note.trim() }, transaction?.id);
    onClose();
    toast(transaction ? text.updated : text.added);
  };

  const remove = transaction
    ? () => {
        deleteTransaction(transaction.id);
        onClose();
        toast(text.deleted);
      }
    : undefined;

  return (
    <DialogForm
      title={transaction ? text.editTitle : text.newTitle}
      submitLabel={transaction ? dict.common.saveChanges : text.add}
      onSubmit={submit}
      onCancel={onClose}
      onDelete={remove}
      submitDisabled={!categoryId}
    >
      <Field label={dict.common.amount}>
        <Input type="number" inputMode="decimal" step="0.01" min="0.01" required data-autofocus value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>
      <Field label={dict.common.category}>
        <CategorySelect data={data} value={categoryId} onChange={setCategoryId} required />
      </Field>
      <BudgetHint data={data} categoryId={categoryId} date={date} pending={pending} />
      <Field label={text.date}>
        <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <Field label={text.note}>
        <Input placeholder={text.notePlaceholder} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
    </DialogForm>
  );
}
