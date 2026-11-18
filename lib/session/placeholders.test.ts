import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createBook, deleteAccount, listBooks, listInvites, respondToInvite } from "./placeholders.ts";

describe("session placeholders", () => {
  it("does not pretend a book, an invite, or deleting the account succeeded", () => {
    assert.deepEqual(listBooks(), { ok: false, reason: "unavailable" });
    assert.deepEqual(listInvites(), []);
    assert.deepEqual(createBook("Personal"), { ok: false, reason: "unavailable" });
    assert.deepEqual(respondToInvite("invite", true), { ok: false, reason: "unavailable" });
    assert.deepEqual(deleteAccount(), { ok: false, reason: "unavailable" });
  });
});
