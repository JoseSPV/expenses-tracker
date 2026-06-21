"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Trash2, ChevronDown, Download } from "lucide-react";
import {
  buildMonthSummaryCsv,
  downloadCsv,
  getMonthExportFilename,
} from "../lib/export-month-csv";

interface Expense {
  id: number;
  amount: number;
  description: string;
  category: string;
  date: string;
}

const DEFAULT_CATEGORIAS: string[] = [
  "Restaurantes",
  "Cafeterías",
  "Supermercados",
  "Droguería",
  "Taxi",
  "Hoteles",
  "Autobús",
  "Hogar",
  "Ropa",
];

const STORAGE_KEY = "daily-expenses-es";
const CATEGORIES_STORAGE_KEY = "daily-expenses-categories-es";

const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

function parseExpenseDate(dateStr: string): Date {
  const parts = dateStr.split("/");
  if (parts.length !== 3) return new Date(NaN);

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);

  return new Date(year, month, day);
}

function getMonthKey(dateStr: string): string {
  const date = parseExpenseDate(dateStr);
  if (isNaN(date.getTime())) return "unknown";

  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

function formatMonthLabel(monthKey: string): string {
  if (monthKey === "unknown") return "Sin fecha";

  const [year, month] = monthKey.split("-").map(Number);
  const label = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));

  return label.charAt(0).toUpperCase() + label.slice(1);
}

interface MonthGroup {
  monthKey: string;
  label: string;
  expenses: Expense[];
  total: number;
}

function groupExpensesByMonth(expenses: Expense[]): MonthGroup[] {
  const groups = new Map<string, Expense[]>();

  for (const expense of expenses) {
    const monthKey = getMonthKey(expense.date);
    const monthExpenses = groups.get(monthKey) ?? [];
    monthExpenses.push(expense);
    groups.set(monthKey, monthExpenses);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => {
      if (a === "unknown") return 1;
      if (b === "unknown") return -1;
      return b.localeCompare(a);
    })
    .map(([monthKey, monthExpenses]) => ({
      monthKey,
      label: formatMonthLabel(monthKey),
      expenses: monthExpenses,
      total: monthExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    }));
}

function getTodayInputValue(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function mergeCategories(base: string[], expenses: Expense[]): string[] {
  const seen = new Set(base.map((cat) => cat.toLowerCase()));
  const merged = [...base];

  for (const expense of expenses) {
    const cat = expense.category.trim();
    if (!cat) continue;

    const key = cat.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    merged.push(cat);
  }

  return merged;
}

function findExistingCategory(categories: string[], name: string): string | undefined {
  const key = name.toLowerCase();
  return categories.find((cat) => cat.toLowerCase() === key);
}

export default function DailyExpensesApp() {
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);
  const [customDate, setCustomDate] = useState<string>(getTodayInputValue);
  const [showCategoryDropdown, setShowCategoryDropdown] =
    useState<boolean>(false);
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);

  const categoryDropdownRef = useRef<HTMLDivElement | null>(null);
  const filterDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let loadedExpenses: Expense[] = [];
    const storedExpenses = localStorage.getItem(STORAGE_KEY);
    if (storedExpenses) {
      try {
        loadedExpenses = JSON.parse(storedExpenses) as Expense[];
      } catch {
        loadedExpenses = [];
      }
    }

    let loadedCategories = DEFAULT_CATEGORIAS;
    const storedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (storedCategories) {
      try {
        const parsed = JSON.parse(storedCategories) as unknown;
        if (
          Array.isArray(parsed) &&
          parsed.every((item) => typeof item === "string")
        ) {
          loadedCategories = parsed;
        }
      } catch {
        loadedCategories = DEFAULT_CATEGORIAS;
      }
    }

    setExpenses(loadedExpenses);
    setCategories(mergeCategories(loadedCategories, loadedExpenses));
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!showFilterDropdown && !showCategoryDropdown) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        showCategoryDropdown &&
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCategoryDropdown(false);
      }
      if (
        showFilterDropdown &&
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      ) {
        setShowFilterDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilterDropdown, showCategoryDropdown]);

  useEffect(() => {
    if (!hasHydrated || typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated || typeof window === "undefined") return;
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  }, [categories, hasHydrated]);

  const addExpense = (): void => {
    if (!amount || isNaN(Number(amount))) return;

    const dateToUse = customDate
      ? new Date(customDate).toLocaleDateString("es-ES")
      : new Date().toLocaleDateString("es-ES");

    const newExpense: Expense = {
      id: Date.now(),
      amount: parseFloat(amount),
      description: description || "Sin descripción",
      category,
      date: dateToUse,
    };

    setExpenses((prev) => [newExpense, ...prev]);
    setAmount("");
    setDescription("");
    setCategory("");
    setCustomDate(getTodayInputValue());
  };

  const deleteExpense = (id: number): void => {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
  };

  const confirmClearAll = (): void => {
    setExpenses([]);
    localStorage.removeItem(STORAGE_KEY);
    setShowConfirmModal(false);
  };

  const toggleFilterCategory = (cat: string): void => {
    setFilterCategories((prev) =>
      prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : [...prev, cat]
    );
  };

  const clearFilters = (): void => setFilterCategories([]);

  const addCategory = (): void => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    const existing = findExistingCategory(categories, trimmed);
    if (existing) {
      setCategory(existing);
      setNewCategoryName("");
      setShowCategoryDropdown(false);
      return;
    }

    setCategories((prev) => [...prev, trimmed]);
    setCategory(trimmed);
    setNewCategoryName("");
    setShowCategoryDropdown(false);
  };

  const filteredExpenses: Expense[] =
    filterCategories.length > 0
      ? expenses.filter((e) => filterCategories.includes(e.category))
      : expenses;

  const total: number = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  const expensesByMonth = groupExpensesByMonth(filteredExpenses);

  const exportMonth = (group: MonthGroup): void => {
    const csv = buildMonthSummaryCsv(group.label, group.expenses);
    downloadCsv(csv, getMonthExportFilename(group.monthKey));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 relative">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Gastos diarios</h1>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4 space-y-4">
            <Input
              type="number"
              placeholder="Importe"
              value={amount}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setAmount(e.target.value)
              }
            />

            <Input
              type="text"
              placeholder="Descripción"
              value={description}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setDescription(e.target.value)
              }
            />

            <div className="space-y-1">
              <p className="text-xs text-gray-700">Fecha (opcional)</p>
              <Input
                type="date"
                value={customDate}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setCustomDate(e.target.value)
                }
              />
            </div>

            <div className="relative" ref={categoryDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setShowCategoryDropdown((prev) => !prev);
                  setShowFilterDropdown(false);
                }}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 pr-10 text-sm text-left text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                {category ? category : "Categoría (opcional)"}
              </button>
              <ChevronDown
                size={18}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              />

              {showCategoryDropdown && (
                <div className="absolute mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-lg z-40 p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCategory("");
                      setShowCategoryDropdown(false);
                    }}
                    className={`w-full text-left rounded-xl px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${
                      category === "" ? "bg-gray-100 text-gray-900" : "text-gray-900"
                    }`}
                  >
                    Categoría (opcional)
                  </button>

                  <div className="my-2 h-px bg-gray-100" />

                  <div className="max-h-56 overflow-auto">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setCategory(cat);
                          setShowCategoryDropdown(false);
                        }}
                        className={`w-full text-left rounded-xl px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${
                          category === cat
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-900"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="my-2 h-px bg-gray-100" />

                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Nueva categoría"
                      value={newCategoryName}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setNewCategoryName(e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCategory();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addCategory}
                      className="shrink-0 rounded-2xl"
                    >
                      Añadir
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Button onClick={addExpense} className="w-full rounded-2xl">
              Añadir gasto
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">
                {filterCategories.length > 0 ? "Total filtrado" : "Total"}
              </span>
              <span className="text-lg font-semibold text-gray-900">
                {currencyFormatter.format(total)}
              </span>
            </div>

            <div className="relative" ref={filterDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setShowFilterDropdown((prev) => !prev);
                  setShowCategoryDropdown(false);
                }}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 pr-10 text-sm text-left text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                {filterCategories.length === 0
                  ? "Todas las categorías"
                  : `${filterCategories.length} seleccionada(s)`}
              </button>
              <ChevronDown
                size={18}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              />

              {showFilterDropdown && (
                <div className="absolute mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-lg z-40 p-3 space-y-2">
                  {categories.map((cat) => (
                    <label
                      key={cat}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={filterCategories.includes(cat)}
                        onChange={() => toggleFilterCategory(cat)}
                        className="rounded border-gray-300"
                      />
                      {cat}
                    </label>
                  ))}

                  {filterCategories.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="w-full rounded-2xl mt-2"
                    >
                      Limpiar filtro
                    </Button>
                  )}
                </div>
              )}
            </div>

            {expenses.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(true)}
                className="w-full rounded-2xl"
              >
                Borrar todos los datos
              </Button>
            )}

            <div className="space-y-6">
              {filteredExpenses.length === 0 && (
                <p className="text-sm text-gray-600">
                  No hay gastos para las categorías seleccionadas
                </p>
              )}

              {expensesByMonth.map((group) => (
                <section key={group.monthKey} className="space-y-3">
                  <div className="flex justify-between items-baseline border-b border-gray-200 pb-2 gap-2">
                    <h2 className="text-sm font-semibold text-gray-900">
                      {group.label}
                    </h2>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => exportMonth(group)}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                        aria-label={`Exportar ${group.label}`}
                      >
                        <Download size={14} />
                        Exportar
                      </button>
                      <span className="text-sm font-medium text-gray-700">
                        {currencyFormatter.format(group.total)}
                      </span>
                    </div>
                  </div>

                  {group.expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex justify-between items-center bg-white rounded-2xl p-3 shadow-sm"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-900">
                          {expense.description}
                        </p>
                        <div className="flex gap-2 text-xs text-gray-600">
                          <span>{expense.date}</span>
                          {expense.category && (
                            <span className="bg-gray-100 px-2 py-0.5 rounded-full text-gray-700">
                              {expense.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-900">
                          {currencyFormatter.format(expense.amount)}
                        </span>
                        <button
                          onClick={() => deleteExpense(expense.id)}
                          className="text-gray-500 hover:text-red-500 transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </section>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Confirmar borrado
            </h2>
            <p className="text-sm text-gray-700">
              Esta acción eliminará todos los gastos y no se puede deshacer.
            </p>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-2xl"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 rounded-2xl"
                onClick={confirmClearAll}
              >
                Borrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
