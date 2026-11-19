import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shellTitle } from "./shell-content.ts";

const titles = {
  privacyTitle: "Privacidad",
  sectionTitle: "Resumen",
  appName: "Joenance",
};

describe("shellTitle", () => {
  it("uses the privacy title on that page", () => {
    assert.equal(shellTitle({ ...titles, privacy: true }), "Privacidad");
  });

  it("uses the section title on the app", () => {
    assert.equal(shellTitle({ ...titles, privacy: false }), "Resumen");
    assert.equal(shellTitle({ ...titles, privacy: false, sectionTitle: null }), "Joenance");
  });
});
