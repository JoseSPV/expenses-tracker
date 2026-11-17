import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { homeScreen } from "./home-screen.ts";

describe("homeScreen", () => {
  it("keeps the trial when nobody is signed in", () => {
    assert.equal(homeScreen({ signedIn: false, books: "unknown" }), "trial");
    assert.equal(homeScreen({ signedIn: false, books: 0 }), "trial");
    assert.equal(homeScreen({ signedIn: false, books: 1 }), "trial");
  });

  it("does not invent an empty book list when the count failed", () => {
    assert.equal(homeScreen({ signedIn: true, books: "unknown" }), "books-unknown");
  });

  it("shows the empty state when the person has no books", () => {
    assert.equal(homeScreen({ signedIn: true, books: 0 }), "no-books");
  });

  it("opens a book when the person has one", () => {
    assert.equal(homeScreen({ signedIn: true, books: 2 }), "book");
  });
});
