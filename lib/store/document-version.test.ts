import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { upgradeDocument } from "./document-version.ts";

const v1 = {
  version: 1,
  categories: [{ id: "rent", name: "Alquiler", color: "#000", type: "expense" }],
  transactions: [],
  budgets: { rent: 800 },
  goals: [],
  recurring: [],
  accounts: [],
  netWorthHistory: [],
};

describe("upgradeDocument", () => {
  it("adds an empty portfolio to a version 1 document and keeps the rest", () => {
    const upgraded = upgradeDocument(v1);

    assert.equal(upgraded?.version, 2);
    assert.deepEqual(upgraded?.instruments, []);
    assert.deepEqual(upgraded?.investmentTransactions, []);
    assert.deepEqual(upgraded?.budgets, { rent: 800 });
  });

  it("returns a version 2 document as it is", () => {
    const v2 = { ...v1, version: 2, instruments: [], investmentTransactions: [] };

    assert.equal(upgradeDocument(v2), v2);
  });

  it("rejects an unknown version or a broken shape", () => {
    assert.equal(upgradeDocument({ ...v1, version: 3 }), null);
    assert.equal(upgradeDocument({ ...v1, version: 2 }), null);
    assert.equal(upgradeDocument({ ...v1, goals: null }), null);
    assert.equal(upgradeDocument("text"), null);
  });
});
