import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sanitizeContent } from "../utils/sanitize.js";

describe("sanitizeContent", () => {
  it("strips script tags", () => {
    const html = sanitizeContent('<p>Hi</p><script>alert(1)</script>');
    assert.equal(html.includes("<script"), false);
    assert.equal(html.includes("Hi"), true);
  });

  it("keeps safe anchors with hardened rel", () => {
    const html = sanitizeContent('<a href="https://example.com">link</a>');
    assert.match(html, /href="https:\/\/example\.com"/);
    assert.match(html, /rel="[^"]*noopener/);
  });

  it("removes javascript: urls", () => {
    const html = sanitizeContent('<a href="javascript:alert(1)">x</a>');
    assert.equal(html.includes("javascript:"), false);
  });
});
