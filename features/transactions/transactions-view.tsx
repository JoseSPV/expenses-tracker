"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useMonth } from "@/components/layout/month-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ColorDot, EmptyState } from "@/components/ui/indicators";
import { Input, Select } from "@/components/ui/input";
import { ViewSkeleton } from "@/components/ui/view-skeleton";
import { useI18n } from "@/i18n/i18n-provider";
import { formattingLocale } from "@/i18n/config";
import { buildMonthSummaryCsv, downloadCsv } from "@/lib/export-month-csv";
import { categoryOrPlaceholder, spendingByCategory, totals, transactionsInMonth, typeOf } from "@/lib/domain/selectors";
import { fold } from "@/lib/domain/text";
import type { AppData, CategoryType, MonthKey, Transaction } from "@/lib/domain/types";
import { useAppData } from "@/lib/store/use-app-data";
import { TransactionFormDialog } from "./transaction-form-dialog";

interface Filters {
  query: string;
  type: CategoryType | "all";
  categoryId: string;
}

function filterTransactions(data: AppData, month: MonthKey, filters: Filters, placeholder: string): Transaction[] {
  const query = fold(filters.query.trim());
  return transactionsInMonth(data, month)
    .filter((t) => filters.type === "all" || typeOf(data, t) === filters.type)
    .filter((t) => filters.categoryId === "all" || t.categoryId === filters.categoryId)
    .filter((t) => !query || fold(`${t.note} ${categoryOrPlaceholder(data, t.categoryId, placeholder).name}`).includes(query))
    .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}

function groupByDate(transactions: Transaction[]): [string, Transaction[]][] {
  const groups = new Map<string, Transaction[]>();
  for (const transaction of transactions) {
    const group = groups.get(transaction.date);
    if (group) group.push(transaction);
    else groups.set(transaction.date, [transaction]);
  }
  return [...groups];
}

export function TransactionsView() {
  const data = useAppData();
  const { month, goTo } = useMonth();
  const { dict, format, locale } = useI18n();
  const text = dict.transactions;
  const [filters, setFilters] = useState<Filters>({ query: "", type: "all", categoryId: "all" });
  const [editing, setEditing] = useState<Transaction | null>(null);

  if (!data || !month) return <ViewSkeleton />;

  const list = filterTransactions(data, month, filters, dict.common.uncategorized);
  const summary = totals(data, list);
  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => setFilters((f) => ({ ...f, [key]: value }));

  const exportMonth = () => {
    const rows = spendingByCategory(data, month).map((s) => ({
      category: categoryOrPlaceholder(data, s.categoryId, dict.common.uncategorized).name,
      total: s.amount,
    }));
    const { filename, delimiter, decimalSeparator, ...labels } = dict.csv;
    const csv = buildMonthSummaryCsv(format.month(month), rows, {
      labels,
      delimiter,
      decimalSeparator,
      collation: formattingLocale[locale],
    });
    downloadCsv(csv, format.message(filename, { month }));
  };

  return (
    <section className="flex animate-fade-in flex-col gap-5">
      <Card role="search" className="flex flex-wrap gap-2.5 p-3.5">
        <Input
          type="search"
          className="min-w-0 flex-[1_1_220px]"
          placeholder={text.search}
          aria-label={text.searchLabel}
          value={filters.query}
          onChange={(e) => setFilter("query", e.target.value)}
        />
        <Select className="w-full sm:w-auto" aria-label={text.filterType} value={filters.type} onChange={(e) => setFilter("type", e.target.value as Filters["type"])}>
          <option value="all">{text.allTypes}</option>
          <option value="expense">{dict.common.expenses}</option>
          <option value="income">{dict.common.income}</option>
        </Select>
        <Select className="w-full sm:w-auto" aria-label={text.filterCategory} value={filters.categoryId} onChange={(e) => setFilter("categoryId", e.target.value)}>
          <option value="all">{text.allCategories}</option>
          {data.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Button onClick={exportMonth} title={text.exportHint}>
          <Download size={16} aria-hidden />
          {text.export}
        </Button>
      </Card>

      <Card>
        <div className="mb-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted sm:flex sm:flex-wrap sm:gap-x-5">
          <span>{format.plural(text.count, list.length)}</span>
          <span>
            {text.in} <strong className="text-fg">{format.money(summary.income)}</strong>
          </span>
          <span>
            {text.out} <strong className="text-fg">{format.money(summary.expense)}</strong>
          </span>
          <span>
            {text.net} <strong className="text-fg">{format.money(summary.net)}</strong>
          </span>
        </div>

        {list.length === 0 ? (
          <EmptyMonth month={month} transactions={data.transactions} onJump={goTo} filtered={transactionsInMonth(data, month).length > 0} />
        ) : (
          groupByDate(list).map(([date, items]) => (
            <div key={date} className="mt-3 first:mt-0">
              <h3 className="p-2 text-xs font-semibold tracking-wide text-muted uppercase">
                {format.date(date, { weekday: "long", day: "numeric", month: "long" })}
              </h3>
              {items.map((t) => {
                const category = categoryOrPlaceholder(data, t.categoryId, dict.common.uncategorized);
                const income = category.type === "income";
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setEditing(t)}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-[10px] px-2 py-2.5 text-left hover:bg-surface-2"
                  >
                    <ColorDot color={category.color} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <strong className="truncate font-semibold">{t.note || category.name}</strong>
                      <small className="text-[13px] text-muted">{category.name}</small>
                    </span>
                    <span className={`font-semibold whitespace-nowrap tabular-nums ${income ? "text-success" : ""}`}>
                      {income ? "+" : "−"}
                      {format.money(t.amount)}
                    </span>
                  </button>
                );
              })}
            </div>
          ))
        )}
      </Card>

      <TransactionFormDialog open={editing !== null} onClose={() => setEditing(null)} transaction={editing ?? undefined} />
    </section>
  );
}

/** The month filter hides older transactions. When this month is empty, point at the latest one that has any. */
function EmptyMonth({
  month,
  transactions,
  filtered,
  onJump,
}: {
  month: MonthKey;
  transactions: Transaction[];
  filtered: boolean;
  onJump: (month: MonthKey) => void;
}) {
  const { dict, format } = useI18n();
  const text = dict.transactions;
  const latest = transactions.map((t) => t.date.slice(0, 7)).sort().at(-1);

  if (filtered || !latest || latest === month) return <EmptyState>{text.empty}</EmptyState>;

  return (
    <EmptyState>
      {format.message(text.emptyMonth, { month: format.month(month) })} {text.emptyElsewhere}{" "}
      <button type="button" className="cursor-pointer text-primary underline" onClick={() => onJump(latest)}>
        {format.message(text.showMonth, { month: format.month(latest) })}
      </button>
    </EmptyState>
  );
}
