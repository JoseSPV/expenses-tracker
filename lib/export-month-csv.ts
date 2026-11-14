export interface MonthSummaryCsvOptions {
  labels: { month: string; category: string; total: string; grandTotal: string };
  delimiter: string;
  decimalSeparator: string;
  /** BCP 47 tag used to sort category names. */
  collation: string;
}

export interface CategoryTotal {
  category: string;
  total: number;
}

function escapeField(value: string, delimiter: string): string {
  if (value.includes(delimiter) || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Monthly expense summary: one row per category, alphabetical, plus a grand total. */
export function buildMonthSummaryCsv(
  monthLabel: string,
  rows: CategoryTotal[],
  { labels, delimiter, decimalSeparator, collation }: MonthSummaryCsvOptions,
): string {
  const field = (value: string) => escapeField(value, delimiter);
  const amount = (value: number) => value.toFixed(2).replace(".", decimalSeparator);
  const sorted = [...rows].sort((a, b) => a.category.localeCompare(b.category, collation));
  const grandTotal = sorted.reduce((total, row) => total + row.total, 0);

  const lines = [
    `${field(labels.month)}${delimiter}${field(monthLabel)}`,
    "",
    `${field(labels.category)}${delimiter}${field(labels.total)}`,
    ...sorted.map((row) => `${field(row.category)}${delimiter}${amount(row.total)}`),
    "",
    `${field(labels.grandTotal)}${delimiter}${amount(grandTotal)}`,
  ];

  // The BOM makes Excel open the file as UTF-8.
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
