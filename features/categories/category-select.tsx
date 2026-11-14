"use client";

import type { SelectHTMLAttributes } from "react";
import { Select } from "@/components/ui/input";
import { useI18n } from "@/i18n/i18n-provider";
import type { AppData, Category, CategoryType } from "@/lib/domain/types";

const TYPES: CategoryType[] = ["expense", "income"];

interface CategorySelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  data: AppData;
  onChange: (categoryId: string) => void;
  include?: (category: Category) => boolean;
}

/** Categories grouped by type; empty groups are hidden. */
export function CategorySelect({ data, onChange, include = () => true, ...props }: CategorySelectProps) {
  const { dict } = useI18n();
  const groupLabel: Record<CategoryType, string> = { expense: dict.common.expenses, income: dict.common.income };

  return (
    <Select {...props} onChange={(event) => onChange(event.target.value)}>
      {TYPES.map((type) => {
        const options = data.categories.filter((c) => c.type === type && include(c));
        return options.length ? (
          <optgroup key={type} label={groupLabel[type]}>
            {options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </optgroup>
        ) : null;
      })}
    </Select>
  );
}
