import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasOwnData, importTrialData, isEmptyDocument } from "./trial-import.ts";
import type { AppData, Transaction } from "../domain/types.ts";

const OWN_ID = "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b";

function document(overrides: Partial<AppData> = {}): AppData {
  return {
    version: 2,
    categories: [],
    transactions: [],
    budgets: {},
    goals: [],
    recurring: [],
    accounts: [],
    netWorthHistory: [],
    instruments: [],
    investmentTransactions: [],
    ...overrides,
  };
}

const movement = (id: string, version?: number): Transaction => ({ id, date: "2026-11-02", categoryId: "groceries", amount: 42, note: "", version });

const demo = () =>
  document({
    categories: [{ id: "groceries", name: "Supermercado", color: "#22c55e", type: "expense" }],
    transactions: [movement("seed-1")],
    budgets: { groceries: 350 },
  });

describe("hasOwnData", () => {
  it("ignores demo data nobody touched", () => {
    assert.equal(hasOwnData(demo()), false);
  });

  it("counts something created in the app", () => {
    const trial = demo();
    trial.transactions.push(movement(OWN_ID));
    assert.equal(hasOwnData(trial), true);
  });

  it("counts a demo movement that was edited", () => {
    assert.equal(hasOwnData(document({ transactions: [movement("seed-1", 2)] })), true);
  });
});

describe("isEmptyDocument", () => {
  it("treats net worth history alone as empty", () => {
    assert.equal(isEmptyDocument(document({ netWorthHistory: [{ month: "2026-11", assets: 0, liabilities: 0 }] })), true);
  });

  it("treats a budget as content", () => {
    assert.equal(isEmptyDocument(document({ budgets: { groceries: 100 } })), false);
  });
});

describe("importTrialData", () => {
  it("copies the whole trial, demo included, and leaves the trial as it was", () => {
    const trial = demo();
    trial.transactions.push(movement(OWN_ID));
    const before = structuredClone(trial);

    const outcome = importTrialData(document(), trial);

    assert.equal(outcome.result, "imported");
    assert.ok(outcome.result === "imported");
    assert.deepEqual(outcome.data, trial);
    assert.notEqual(outcome.data, trial);
    outcome.data.transactions.pop();
    assert.deepEqual(trial, before);
  });

  it("refuses an account that already has data", () => {
    const trial = document({ transactions: [movement(OWN_ID)] });
    assert.deepEqual(importTrialData(document({ transactions: [movement("mine")] }), trial), { result: "notEmpty" });
  });

  it("has nothing to copy from demo data only or a missing trial", () => {
    assert.deepEqual(importTrialData(document(), demo()), { result: "nothing" });
    assert.deepEqual(importTrialData(document(), null), { result: "nothing" });
  });
});
