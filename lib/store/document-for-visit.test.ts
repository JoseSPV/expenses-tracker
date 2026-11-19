import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AppData } from "../domain/types.ts";
import { documentForVisit, emptyAppData } from "./document-for-visit.ts";

const stored: AppData = { ...emptyAppData(), categories: [{ id: "rent", name: "Alquiler", color: "#000", type: "expense" }] };
const seed: AppData = { ...emptyAppData(), categories: [{ id: "demo", name: "Demo", color: "#fff", type: "income" }] };

describe("documentForVisit", () => {
  it("starts a signed-in visit empty instead of seeding the trial", () => {
    assert.deepEqual(documentForVisit({ account: true, stored: null, trialSeed: seed }), emptyAppData());
  });

  it("keeps what the signed-in visit already stored", () => {
    assert.equal(documentForVisit({ account: true, stored, trialSeed: seed }), stored);
  });

  it("seeds the trial only when nobody is signed in and nothing is stored", () => {
    assert.equal(documentForVisit({ account: false, stored: null, trialSeed: seed }), seed);
    assert.equal(documentForVisit({ account: false, stored, trialSeed: seed }), stored);
  });
});
