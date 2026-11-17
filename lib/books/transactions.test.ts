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
    assert.equal(first.items[0]?.id, "t31");
    assert.equal(first.items[29]?.id, "t02");
    assert.ok(first.nextCursor);

    const second = listMonthTransactions(movements, { month: "2026-11", cursor: first.nextCursor });

    assert.deepEqual(
      second.items.map((item) => item.id),
      ["t01"],
    );
    assert.equal(second.nextCursor, undefined);
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
});
