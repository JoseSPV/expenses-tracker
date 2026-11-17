import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { signInProblem } from "./google-sign-in.ts";

describe("signInProblem", () => {
  it("asks for a connection before it asks for Google", () => {
    assert.equal(signInProblem({ online: false, configured: false }), "offline");
    assert.equal(signInProblem({ online: false, configured: true }), "offline");
  });

  it("says Google is not connected when the browser is online", () => {
    assert.equal(signInProblem({ online: true, configured: false }), "unavailable");
  });

  it("lets the button start when Google is connected and the browser is online", () => {
    assert.equal(signInProblem({ online: true, configured: true }), null);
  });
});
