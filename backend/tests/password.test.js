import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validatePassword } from "../utils/password.js";

describe("validatePassword", () => {
  it("rejects short passwords", () => {
    const result = validatePassword("Ab1");
    assert.equal(result.ok, false);
  });

  it("rejects passwords without a letter", () => {
    const result = validatePassword("12345678");
    assert.equal(result.ok, false);
    assert.match(result.message, /letter/i);
  });

  it("rejects passwords without a number", () => {
    const result = validatePassword("abcdefgh");
    assert.equal(result.ok, false);
    assert.match(result.message, /number/i);
  });

  it("accepts a valid password", () => {
    const result = validatePassword("password1");
    assert.equal(result.ok, true);
  });
});
