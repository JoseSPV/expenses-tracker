"use client";

import { useState } from "react";
import Link from "next/link";
import { useMonth } from "@/components/layout/month-context";
import { hrefFor } from "@/components/layout/navigation";
import { Dialog, DialogForm } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/indicators";
import { Field, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { CategorySelect } from "@/features/categories/category-select";
import { useI18n } from "@/i18n/i18n-provider";
import { budgetStatus } from "@/lib/domain/budgets";
import { dateInMonth, dayOfMonth, monthKey, today } from "@/lib/domain/dates";
import { parseMoney } from "@/lib/domain/money";
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
      <Progress label={format.message(dict.transactions.budgetHint, { spent: format.money(spent), limit: format.money(limit) })} ratio={spent / limit} status={budgetStatus(spent / limit)} />
    </div>
  );
}

function TransactionForm({ data, transaction, onClose }: { data: AppData; transaction?: Transaction; onClose: () => void }) {
  const { dict, locale } = useI18n();
  const { month, goTo } = useMonth();
  const toast = useToast();
  const text = dict.transactions;
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : "");
  const [categoryId, setCategoryId] = useState(
    transaction?.categoryId ?? data.categories.find((c) => c.type === "expense")?.id ?? data.categories[0]?.id ?? "",
  );
  const [date, setDate] = useState(transaction?.date ?? (month ? dateInMonth(month, dayOfMonth(today())) : today()));
  const [note, setNote] = useState(transaction?.note ?? "");
  const parsed = parseMoney(amount);
  const alreadyCounted =
    transaction && transaction.categoryId === categoryId && monthKey(transaction.date) === monthKey(date) ? transaction.amount : 0;
  const pending = (parsed !== null && parsed > 0 ? parsed : 0) - alreadyCounted;

  const submit = () => {
    if (parsed === null || parsed <= 0 || !saveTransaction({ amount: parsed, categoryId, date, note: note.trim() }, transaction?.id, transaction?.version ?? 1)) {
      toast(dict.common.notSaved);
      return;
    }
    goTo(monthKey(date));
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
      submitDisabled={!categoryId || parsed === null || parsed <= 0}
    >
      <div data-tour="movement-amount">
        <Field label={dict.common.amount}>
          <Input type="number" inputMode="decimal" step="0.01" min="0.01" required data-autofocus value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
      </div>
      <div data-tour="movement-category">
        <Field label={dict.common.category}>
          <CategorySelect data={data} value={categoryId} onChange={setCategoryId} required />
        </Field>
      </div>
      {data.categories.length === 0 ? (
        <p className="-mt-2 text-[13px] text-muted">
          {text.needCategory}{" "}
          <Link href={hrefFor(locale, "categories")} className="font-semibold text-primary hover:underline" onClick={onClose}>
            {dict.nav.categories}
          </Link>
        </p>
      ) : null}
      <BudgetHint data={data} categoryId={categoryId} date={date} pending={pending} />
      <div data-tour="movement-date">
        <Field label={text.date}>
          <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      <Field label={text.note}>
        <Input placeholder={text.notePlaceholder} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
    </DialogForm>
  );
}
