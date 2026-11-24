import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deleteVersioned, listInstrumentOperations, saveVersioned } from "./investments.ts";
import type { InvestmentTransaction } from "../domain/types.ts";

function buy(id: string, date: string, instrumentId = "acme"): InvestmentTransaction {
  return {
    type: "buy",
    id,
    instrumentId,
    date,
    quantity: 1,
    unitPrice: 10,
    eurRate: 1,
    fee: { amount: 0, currency: "EUR" },
    note: "",
    eur: { gross: 10, fee: 0 },
    version: 1,
  };
}

describe("listInstrumentOperations", () => {
  it("pages one instrument's operations, newest first", () => {
    const operations = [
      ...Array.from({ length: 31 }, (_, index) => buy(`o${String(index).padStart(2, "0")}`, `2026-01-${String((index % 28) + 1).padStart(2, "0")}`)),
      buy("other", "2026-12-31", "globex"),
    ];

    const first = listInstrumentOperations(operations, { instrumentId: "acme" });
    const second = listInstrumentOperations(operations, { instrumentId: "acme", cursor: first.nextCursor });

    assert.equal(first.items.length, 30);
    assert.equal(first.items[0]?.date, "2026-01-28");
    assert.equal(second.items.length, 1);
    assert.equal(second.nextCursor, undefined);
    assert.ok([...first.items, ...second.items].every((op) => op.instrumentId === "acme"));
  });

  it("filters by type", () => {
    const page = listInstrumentOperations([buy("b", "2026-01-01")], { instrumentId: "acme", type: "dividend" });

    assert.deepEqual(page.items, []);
  });
});

describe("saveVersioned", () => {
  it("rejects a save made with an old version and returns the stored one", () => {
    const first = saveVersioned([buy("b", "2026-01-01")], { ...buy("b", "2026-01-02"), version: undefined }, 1);
    assert.equal(first.ok, true);
    if (!first.ok) return;

    const second = saveVersioned(first.items, buy("b", "2026-01-03"), 1);

    assert.equal(second.ok, false);
    if (second.ok || !("current" in second)) return;
    assert.equal(second.current.date, "2026-01-02");
    assert.equal(second.current.version, 2);
  });
});

describe("deleteVersioned", () => {
  it("treats an item that is already gone as deleted", () => {
    assert.deepEqual(deleteVersioned([], "missing", 1), { ok: true, items: [] });
  });

  it("keeps an item changed by someone else", () => {
    const result = deleteVersioned([{ ...buy("b", "2026-01-01"), version: 3 }], "b", 2);

    assert.equal(result.ok, false);
  });
});
