import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { listMonthTransactions, saveTransaction } from "./transactions.ts";

describe("listMonthTransactions", () => {
  it("returns at most 30 movements for the month, newest first", () => {
    const movements = Array.from({ length: 31 }, (_, index) => {
      const n = String(index + 1).padStart(2, "0");
      return {
        id: `t${n}`,
        amount: index + 1,
        categoryId: "food",
        date: "2026-11-01",
        note: "",
        version: 1,
      };
    });

    const first = listMonthTransactions(movements, { month: "2026-11" });

    assert.equal(first.items.length, 30);
    assert.equal(first.items[0]?.id, "t01");
    assert.equal(first.items[29]?.id, "t30");
    assert.ok(first.nextCursor);

    const second = listMonthTransactions(movements, { month: "2026-11", cursor: first.nextCursor });

    assert.deepEqual(
      second.items.map((item) => item.id),
      ["t31"],
    );
    assert.equal(second.nextCursor, undefined);
  });

  it("returns nothing when the cursor is not in the month", () => {
    const movements = [
      { id: "t01", amount: 1, categoryId: "food", date: "2026-11-01", note: "", version: 1 },
    ];

    const page = listMonthTransactions(movements, { month: "2026-11", cursor: "missing" });

    assert.deepEqual(page.items, []);
    assert.equal(page.nextCursor, undefined);
  });
});

describe("saveTransaction", () => {
  it("keeps the saved amount when a second save still has the old version", () => {
    const movements = [
      {
        id: "rent",
        amount: 10,
        categoryId: "home",
        date: "2026-11-02",
        note: "",
        version: 1,
      },
    ];

    const first = saveTransaction(movements, { ...movements[0], amount: 12, expectedVersion: 1 });
    assert.equal(first.ok, true);
    if (!first.ok) return;

    const second = saveTransaction(first.movements, { ...movements[0], amount: 99, expectedVersion: 1 });

    assert.equal(second.ok, false);
    if (second.ok) return;
    assert.equal(second.current.amount, 12);
    assert.equal(second.current.version, 2);
    assert.equal(first.movements[0]?.amount, 12);
  });

  it("does not invent a movement when the id is unknown", () => {
    const result = saveTransaction([], {
      id: "missing",
      amount: 5,
      categoryId: "food",
      date: "2026-11-01",
      note: "",
      expectedVersion: 1,
    });

    assert.deepEqual(result, { ok: false, missing: true });
  });

  it("treats a stored movement without a version as version 1", () => {
    const movements = [{ id: "rent", amount: 10, categoryId: "home", date: "2026-11-02", note: "" }];

    const saved = saveTransaction(movements, { ...movements[0], amount: 12, expectedVersion: 1 });

    assert.equal(saved.ok, true);
    if (!saved.ok) return;
    assert.equal(saved.movements[0]?.amount, 12);
    assert.equal(saved.movements[0]?.version, 2);
  });
});
