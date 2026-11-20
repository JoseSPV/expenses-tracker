"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useMonth } from "@/components/layout/month-context";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge, ColorDot, EmptyState } from "@/components/ui/indicators";
import { ViewSkeleton } from "@/components/ui/view-skeleton";
import type { Formatters } from "@/i18n/formatters";
import { useI18n } from "@/i18n/i18n-provider";
import type { Dictionary } from "@/i18n/types";
import { categoriesOfType } from "@/lib/domain/selectors";
import type { AppData, Category, CategoryType, MonthKey } from "@/lib/domain/types";
import { useAppData } from "@/lib/store/use-app-data";
import { CategoryFormDialog } from "./category-form-dialog";

type Editing = { category?: Category; type: CategoryType } | null;

/** All-time count, worded against the selected month so it never claims movements that list is not showing. */
function usageLabel(data: AppData, categoryId: string, month: MonthKey | null, text: Dictionary["categories"], format: Formatters): string {
  const matches = data.transactions.filter((t) => t.categoryId === categoryId);
  if (matches.length === 0) return text.usageNone;
  if (!month) return format.plural(text.usage, matches.length);
  const inMonth = matches.filter((t) => t.date.startsWith(month)).length;
  if (inMonth === matches.length) return format.plural(text.usageThisMonth, inMonth);
  if (inMonth === 0) return format.plural(text.usageElsewhere, matches.length);
  return format.message(text.usageBoth, { monthCount: inMonth, total: matches.length });
}

function CategoryList({ data, type, onEdit }: { data: AppData; type: CategoryType; onEdit: (category: Category) => void }) {
  const { dict, format } = useI18n();
  const { month } = useMonth();
  const text = dict.categories;
  const categories = categoriesOfType(data, type);

  if (categories.length === 0) return <EmptyState>{text.empty}</EmptyState>;

  return (
    <ul className="flex flex-col">
      {categories.map((category) => {
        const budget = data.budgets[category.id];
        return (
          <li key={category.id}>
            <button
              type="button"
              onClick={() => onEdit(category)}
              className="flex w-full cursor-pointer flex-col gap-2 rounded-[10px] px-2 py-2.5 text-left hover:bg-surface-2 sm:flex-row sm:items-center sm:gap-3"
            >
              <span className="flex min-w-0 flex-1 items-center gap-3">
                <ColorDot color={category.color} className="size-3" />
                <span className="flex min-w-0 flex-col">
                  <strong className="truncate font-semibold">{category.name}</strong>
                  <small className="text-[13px] text-muted">{usageLabel(data, category.id, month, text, format)}</small>
                </span>
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
    <Card data-tour={type === "expense" ? "category-expense" : "category-income"}>
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
