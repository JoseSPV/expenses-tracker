const CSV_DELIMITER = ";";

interface ExpenseLike {
  amount: number;
  category: string;
}

interface CategorySummary {
  category: string;
  total: number;
}

function escapeCsvField(value: string): string {
  if (
    value.includes(CSV_DELIMITER) ||
    value.includes('"') ||
    value.includes("\n")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatAmountForCsv(amount: number): string {
  return amount.toFixed(2).replace(".", ",");
}

export function groupExpensesByCategory(
  expenses: ExpenseLike[]
): CategorySummary[] {
  const groups = new Map<string, number>();

  for (const expense of expenses) {
    const category = expense.category.trim() || "Sin categoría";
    groups.set(category, (groups.get(category) ?? 0) + expense.amount);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => {
      if (a === "Sin categoría") return 1;
      if (b === "Sin categoría") return -1;
      return a.localeCompare(b, "es");
    })
    .map(([category, total]) => ({ category, total }));
}

export function buildMonthSummaryCsv(
  monthLabel: string,
  expenses: ExpenseLike[]
): string {
  const summaries = groupExpensesByCategory(expenses);
  const grandTotal = summaries.reduce((sum, item) => sum + item.total, 0);

  const lines = [
    `${escapeCsvField("Mes")}${CSV_DELIMITER}${escapeCsvField(monthLabel)}`,
    "",
    `${escapeCsvField("Categoría")}${CSV_DELIMITER}${escapeCsvField("Total")}`,
    ...summaries.map(
      ({ category, total }) =>
        `${escapeCsvField(category)}${CSV_DELIMITER}${formatAmountForCsv(total)}`
    ),
    "",
    `${escapeCsvField("TOTAL")}${CSV_DELIMITER}${formatAmountForCsv(grandTotal)}`,
  ];

  return `\uFEFF${lines.join("\n")}`;
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function getMonthExportFilename(monthKey: string): string {
  return `gastos-${monthKey}.csv`;
}
