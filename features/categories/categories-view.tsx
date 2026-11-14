"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge, ColorDot, EmptyState } from "@/components/ui/indicators";
import { ViewSkeleton } from "@/components/ui/view-skeleton";
import { useI18n } from "@/i18n/i18n-provider";
import { categoriesOfType, categoryUsage } from "@/lib/domain/selectors";
import type { AppData, Category, CategoryType } from "@/lib/domain/types";
import { useAppData } from "@/lib/store/use-app-data";
import { CategoryFormDialog } from "./category-form-dialog";

type Editing = { category?: Category; type: CategoryType } | null;

function CategoryList({ data, type, onEdit }: { data: AppData; type: CategoryType; onEdit: (category: Category) => void }) {
  const { dict, format } = useI18n();
  const text = dict.categories;
  const categories = categoriesOfType(data, type);

  if (categories.length === 0) return <EmptyState>{text.empty}</EmptyState>;

  return (
    <ul className="flex flex-col">
      {categories.map((category) => {
        const usage = categoryUsage(data, category.id);
        const budget = data.budgets[category.id];
        return (
          <li key={category.id}>
            <button
              type="button"
              onClick={() => onEdit(category)}
              className="flex w-full cursor-pointer items-center gap-3 rounded-[10px] px-2 py-2.5 text-left hover:bg-surface-2"
            >
              <ColorDot color={category.color} className="size-3" />
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate font-semibold">{category.name}</strong>
                <small className="text-[13px] text-muted">{format.plural(text.usage, usage.transactions)}</small>
              </span>
              {budget ? <Badge>{format.message(text.budget, { amount: format.money(budget) })}</Badge> : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function CategoriesView() {
  const data = useAppData();
  const { dict } = useI18n();
  const text = dict.categories;
  const [editing, setEditing] = useState<Editing>(null);

  if (!data) return <ViewSkeleton />;

  const section = (type: CategoryType, title: string) => (
    <Card>
      <CardHeader
        title={title}
        action={
          <Button size="sm" variant="primary" onClick={() => setEditing({ type })}>
            <Plus size={14} aria-hidden />
            {text.add}
          </Button>
        }
      />
      <CategoryList data={data} type={type} onEdit={(category) => setEditing({ category, type })} />
    </Card>
  );

  return (
    <section className="grid animate-fade-in gap-5 lg:grid-cols-2">
      {section("expense", text.expenseTitle)}
      {section("income", text.incomeTitle)}
      <CategoryFormDialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        category={editing?.category}
        defaultType={editing?.type ?? "expense"}
      />
    </section>
  );
}
