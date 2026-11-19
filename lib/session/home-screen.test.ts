import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { homeScreen } from "./home-screen.ts";

describe("homeScreen", () => {
  it("keeps the trial when nobody is signed in", () => {
    assert.equal(homeScreen({ signedIn: false }), "trial");
  });

  it("opens the app when someone is signed in", () => {
    assert.equal(homeScreen({ signedIn: true }), "account");
  });
});
