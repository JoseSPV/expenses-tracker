import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAllowedEmail } from "./allowlist.ts";

describe("isAllowedEmail", () => {
  it("allows nobody when the list is missing or empty", () => {
    assert.equal(isAllowedEmail("ada@gmail.com", undefined), false);
    assert.equal(isAllowedEmail("ada@gmail.com", ""), false);
    assert.equal(isAllowedEmail("ada@gmail.com", " , "), false);
  });

  it("matches one of the listed emails, ignoring case and spaces", () => {
    assert.equal(isAllowedEmail("Ada@gmail.com", "ada@gmail.com, grace@gmail.com"), true);
    assert.equal(isAllowedEmail("grace@gmail.com", " ada@gmail.com , grace@gmail.com "), true);
  });

  it("rejects an email that is not listed", () => {
    assert.equal(isAllowedEmail("otro@gmail.com", "ada@gmail.com"), false);
    assert.equal(isAllowedEmail("", "ada@gmail.com"), false);
  });
});
