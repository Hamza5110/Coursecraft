import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ACCESS_COOKIE_NAME,
  readAccessToken,
} from "../utils/cookies.js";

describe("readAccessToken", () => {
  it("prefers the httpOnly cookie", () => {
    const token = readAccessToken({
      cookies: { [ACCESS_COOKIE_NAME]: "cookie-token" },
      headers: { authorization: "Bearer header-token" },
    });
    assert.equal(token, "cookie-token");
  });

  it("falls back to Authorization Bearer", () => {
    const token = readAccessToken({
      cookies: {},
      headers: { authorization: "Bearer header-token" },
    });
    assert.equal(token, "header-token");
  });

  it("returns null when missing", () => {
    assert.equal(readAccessToken({ cookies: {}, headers: {} }), null);
  });
});
