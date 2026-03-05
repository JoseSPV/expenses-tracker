"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Trash2, ChevronDown } from "lucide-react";

interface Expense {
  id: number;
  amount: number;
  description: string;
  category: string;
  date: string;
}

const CATEGORIAS: string[] = [
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

export default function DailyExpensesApp() {
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [customDate, setCustomDate] = useState<string>("");
  const [showCategoryDropdown, setShowCategoryDropdown] =
    useState<boolean>(false);
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);

  const categoryDropdownRef = useRef<HTMLDivElement | null>(null);
  const filterDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setExpenses(JSON.parse(stored) as Expense[]);
      } catch {
        setExpenses([]);
      }
    }
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
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses]);

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
    setCustomDate("");
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

  const filteredExpenses: Expense[] =
    filterCategories.length > 0
      ? expenses.filter((e) => filterCategories.includes(e.category))
      : expenses;

  const total: number = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

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
                    {CATEGORIAS.map((cat) => (
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
                {new Intl.NumberFormat("es-ES", {
                  style: "currency",
                  currency: "EUR",
                }).format(total)}
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
                  {CATEGORIAS.map((cat) => (
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

            <div className="space-y-3">
              {filteredExpenses.length === 0 && (
                <p className="text-sm text-gray-600">
                  No hay gastos para las categorías seleccionadas
                </p>
              )}

              {filteredExpenses.map((expense) => (
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
                      {new Intl.NumberFormat("es-ES", {
                        style: "currency",
                        currency: "EUR",
                      }).format(expense.amount)}
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
