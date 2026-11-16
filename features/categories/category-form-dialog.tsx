"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogForm } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/i18n/i18n-provider";
import { nextPaletteColor } from "@/lib/domain/palette";
import { categoryUsage } from "@/lib/domain/selectors";
import type { AppData, Category, CategoryType } from "@/lib/domain/types";
import { deleteCategory, saveCategory } from "@/lib/store/actions";
import { useAppData } from "@/lib/store/use-app-data";
import { CategorySelect } from "./category-select";

interface CategoryFormDialogProps {
  open: boolean;
  onClose: () => void;
  category?: Category;
  defaultType: CategoryType;
}

export function CategoryFormDialog({ open, onClose, category, defaultType }: CategoryFormDialogProps) {
  const data = useAppData();
  return (
    <Dialog open={open} onClose={onClose}>
      {data ? <CategoryDialogContent data={data} category={category} defaultType={defaultType} onClose={onClose} /> : null}
    </Dialog>
  );
}

function CategoryDialogContent({ data, category, defaultType, onClose }: { data: AppData; category?: Category; defaultType: CategoryType; onClose: () => void }) {
  const [deleting, setDeleting] = useState(false);
  return deleting && category ? (
    <DeleteCategoryForm data={data} category={category} onCancel={() => setDeleting(false)} onDone={onClose} />
  ) : (
    <CategoryForm data={data} category={category} defaultType={defaultType} onClose={onClose} onDelete={() => setDeleting(true)} />
  );
}

function CategoryForm({
  data,
  category,
  defaultType,
  onClose,
  onDelete,
}: {
  data: AppData;
  category?: Category;
  defaultType: CategoryType;
  onClose: () => void;
  onDelete: () => void;
}) {
  const { dict } = useI18n();
  const toast = useToast();
  const text = dict.categories;
  const [name, setName] = useState(category?.name ?? "");
  const [color, setColor] = useState(category?.color ?? nextPaletteColor(data.categories.map((item) => item.color)));
  const [type, setType] = useState<CategoryType>(category?.type ?? defaultType);

  const usage = category ? categoryUsage(data, category.id) : null;
  const typeLocked = Boolean(usage && usage.transactions + usage.recurring > 0);
  const key = name.trim().toLocaleLowerCase("es");
  const duplicate = data.categories.some((c) => c.id !== category?.id && c.name.trim().toLocaleLowerCase("es") === key);

  const submit = () => {
    if (!saveCategory({ name: name.trim(), color, type }, category?.id)) {
      toast(dict.common.notSaved);
      return;
    }
    onClose();
    toast(text.saved);
  };

  return (
    <DialogForm
      title={category ? text.editTitle : text.newTitle}
      submitLabel={category ? dict.common.saveChanges : dict.common.save}
      onSubmit={submit}
      onCancel={onClose}
      submitDisabled={!key || duplicate}
    >
      <Field label={dict.common.name}>
        <Input required data-autofocus placeholder={text.namePlaceholder} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={duplicate} />
      </Field>
      {duplicate ? <p className="-mt-2 text-[13px] text-danger">{text.duplicate}</p> : null}
      <Field label={text.type} hint={typeLocked ? text.typeLocked : undefined}>
        <Select value={type} disabled={typeLocked} onChange={(e) => setType(e.target.value as CategoryType)}>
          <option value="expense">{text.types.expense}</option>
          <option value="income">{text.types.income}</option>
        </Select>
      </Field>
      <Field label={dict.common.color}>
        <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
      </Field>
      {category ? (
        <Button variant="danger" className="self-start" onClick={onDelete}>
          {dict.common.delete}
        </Button>
      ) : null}
    </DialogForm>
  );
}

function DeleteCategoryForm({ data, category, onCancel, onDone }: { data: AppData; category: Category; onCancel: () => void; onDone: () => void }) {
  const { dict, format } = useI18n();
  const toast = useToast();
  const text = dict.categories;
  const usage = categoryUsage(data, category.id);
  const inUse = usage.transactions + usage.recurring > 0;
  const candidates = data.categories.filter((c) => c.type === category.type && c.id !== category.id);
  const [target, setTarget] = useState(candidates[0]?.id ?? "");
  const blocked = inUse && candidates.length === 0;

  const submit = () => {
    deleteCategory(category.id, inUse ? target : undefined);
    onDone();
    toast(text.deleted);
  };

  return (
    <DialogForm
      title={format.message(text.deleteTitle, { name: category.name })}
      submitLabel={dict.common.delete}
      onSubmit={submit}
      onCancel={onCancel}
      submitDisabled={blocked || (inUse && !target)}
    >
      {!inUse ? <p className="text-sm">{text.deleteUnused}</p> : null}
      {inUse && !blocked ? (
        <>
          <p className="text-sm">
            {format.message(text.deleteInUse, {
              usage: format.plural(text.usage, usage.transactions),
              recurring: format.plural(text.recurringUsage, usage.recurring),
            })}
          </p>
          <Field label={text.moveTo}>
            <CategorySelect data={data} value={target} onChange={setTarget} include={(c) => candidates.includes(c)} />
          </Field>
        </>
      ) : null}
      {blocked ? <p className="text-sm text-danger">{text.deleteBlocked}</p> : null}
      {data.budgets[category.id] ? <p className="text-sm text-muted">{text.budgetWillBeRemoved}</p> : null}
    </DialogForm>
  );
}
