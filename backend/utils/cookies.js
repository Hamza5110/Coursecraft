const ACCESS_TOKEN_MS = 7 * 24 * 60 * 60 * 1000;
export const ACCESS_COOKIE_NAME = "bv_access";

export function cookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: ACCESS_TOKEN_MS,
    path: "/",
  };
}

export function setAccessCookie(res, token) {
  res.cookie(ACCESS_COOKIE_NAME, token, cookieOptions());
}

export function clearAccessCookie(res) {
  res.clearCookie(ACCESS_COOKIE_NAME, {
    ...cookieOptions(),
    maxAge: 0,
  });
}

export function readAccessToken(req) {
  const fromCookie = req.cookies?.[ACCESS_COOKIE_NAME];
  if (typeof fromCookie === "string" && fromCookie) {
    return fromCookie;
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return null;
}
