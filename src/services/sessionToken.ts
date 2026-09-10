// Persistence is opt-in. All authenticated requests read the current memory token.
let token: string | null = null;
export function getSessionToken(): string | null { return token; }
export function setSessionToken(value: string | null): void { token = value; }
export function normalizeToken(value: unknown): string {
  if (typeof value !== "string") throw new Error("Invalid token");
  const raw = value.trim().replace(/^Bearer\s+/i, "");
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(raw)) throw new Error("Invalid token");
  return raw;
}
