const MIN_LENGTH = 8;
const MAX_BYTES = 72; // bcrypt truncates beyond 72 bytes

export function validatePassword(password) {
  if (typeof password !== "string") {
    return { ok: false, message: "Password must be a string" };
  }
  if (password.length < MIN_LENGTH) {
    return {
      ok: false,
      message: `Password must be at least ${MIN_LENGTH} characters`,
    };
  }
  if (Buffer.byteLength(password, "utf8") > MAX_BYTES) {
    return {
      ok: false,
      message: `Password must be at most ${MAX_BYTES} bytes`,
    };
  }
  return { ok: true };
}

export const BCRYPT_ROUNDS = 12;
