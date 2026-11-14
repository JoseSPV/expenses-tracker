"use client";

import { useState } from "react";
import { Dialog, DialogForm } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { CategorySelect } from "@/features/categories/category-select";
import { useI18n } from "@/i18n/i18n-provider";
import { categoryOrPlaceholder } from "@/lib/domain/selectors";
import type { AppData } from "@/lib/domain/types";
import { deleteBudget, setBudget } from "@/lib/store/actions";
import { useAppData } from "@/lib/store/use-app-data";

/** Without `categoryId` the form lets the user pick an expense category that has no budget yet. */
export function BudgetFormDialog({ open, onClose, categoryId }: { open: boolean; onClose: () => void; categoryId?: string }) {
  const data = useAppData();
  return (
    <Dialog open={open} onClose={onClose}>
      {data ? <BudgetForm data={data} categoryId={categoryId} onClose={onClose} /> : null}
    </Dialog>
  );
}

function BudgetForm({ data, categoryId, onClose }: { data: AppData; categoryId?: string; onClose: () => void }) {
  const { dict, format } = useI18n();
  const text = dict.budgets;
  const isUnbudgeted = (id: string) => data.categories.some((c) => c.id === id && c.type === "expense" && !(id in data.budgets));
  const [selected, setSelected] = useState(categoryId ?? data.categories.find((c) => isUnbudgeted(c.id))?.id ?? "");
  const [limit, setLimit] = useState(categoryId && data.budgets[categoryId] ? String(data.budgets[categoryId]) : "");
  const exists = Boolean(categoryId && categoryId in data.budgets);

  const submit = () => {
    setBudget(selected, Number(limit));
    onClose();
  };

  return (
    <DialogForm
      title={categoryId ? format.message(text.editTitle, { category: categoryOrPlaceholder(data, categoryId, dict.common.uncategorized).name }) : text.newTitle}
      submitLabel={dict.common.save}
      onSubmit={submit}
      onCancel={onClose}
      onDelete={
        exists && categoryId
          ? () => {
              deleteBudget(categoryId);
              onClose();
            }
          : undefined
      }
      submitDisabled={!selected}
    >
      {!categoryId ? (
        <Field label={dict.common.category}>
          <CategorySelect data={data} value={selected} onChange={setSelected} include={(c) => isUnbudgeted(c.id)} required />
        </Field>
      ) : null}
      <Field label={text.limit}>
        <Input type="number" inputMode="decimal" step="0.01" min="1" required data-autofocus value={limit} onChange={(e) => setLimit(e.target.value)} />
      </Field>
    </DialogForm>
  );
}
