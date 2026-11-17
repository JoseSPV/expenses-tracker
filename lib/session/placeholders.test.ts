import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createBook, currentSession, deleteAccount, googleSignInConfigured, listBooks, listInvites, respondToInvite, signOut } from "./placeholders.ts";

describe("session placeholders", () => {
  it("stays signed out until Supabase is connected", () => {
    assert.deepEqual(currentSession(), { status: "signed-out" });
    assert.equal(googleSignInConfigured, false);
  });

  it("does not pretend a book, an invite, or an account action succeeded", () => {
    assert.deepEqual(listBooks(), { ok: false, reason: "unavailable" });
    assert.deepEqual(listInvites(), []);
    assert.deepEqual(createBook("Personal"), { ok: false, reason: "unavailable" });
    assert.deepEqual(respondToInvite("invite", true), { ok: false, reason: "unavailable" });
    assert.deepEqual(signOut(), { ok: false, reason: "unavailable" });
    assert.deepEqual(deleteAccount(), { ok: false, reason: "unavailable" });
  });
});
