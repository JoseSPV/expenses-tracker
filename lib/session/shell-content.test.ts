import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mainRegion, shellTitle } from "./shell-content.ts";

const titles = {
  privacyTitle: "Privacidad",
  sectionTitle: "Resumen",
  booksTitle: "Tus libros",
  appName: "Joenance",
};

describe("mainRegion", () => {
  it("shows the privacy page while signed in, even when the books cannot be counted", () => {
    assert.equal(mainRegion({ screen: "books-unknown", privacy: true }), "page");
    assert.equal(mainRegion({ screen: "no-books", privacy: true }), "page");
    assert.equal(mainRegion({ screen: "book", privacy: true }), "page");
  });

  it("keeps the signed-in screen when the route is not privacy", () => {
    assert.equal(mainRegion({ screen: "books-unknown", privacy: false }), "books-unknown");
    assert.equal(mainRegion({ screen: "no-books", privacy: false }), "no-books");
    assert.equal(mainRegion({ screen: "book", privacy: false }), "book");
  });

  it("shows the trial page, including privacy", () => {
    assert.equal(mainRegion({ screen: "trial", privacy: false }), "page");
    assert.equal(mainRegion({ screen: "trial", privacy: true }), "page");
  });
});

describe("shellTitle", () => {
  it("uses the privacy title on that page whether or not someone is signed in", () => {
    assert.equal(shellTitle({ ...titles, privacy: true, trial: false }), "Privacidad");
    assert.equal(shellTitle({ ...titles, privacy: true, trial: true }), "Privacidad");
  });

  it("uses the section title on the trial and the books title once signed in", () => {
    assert.equal(shellTitle({ ...titles, privacy: false, trial: true }), "Resumen");
    assert.equal(shellTitle({ ...titles, privacy: false, trial: true, sectionTitle: null }), "Joenance");
    assert.equal(shellTitle({ ...titles, privacy: false, trial: false }), "Tus libros");
  });
});
