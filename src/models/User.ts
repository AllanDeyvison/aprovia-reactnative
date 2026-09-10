export interface User {
  id: number;
  username: string;
  name: string;
  lastname: string;
  email: string;
  birthday: string;
  picture: string | null;
}
export type SessionUser = Pick<User, "id" | "username" | "name" | "picture">;
export function toSessionUser(u: SessionUser): SessionUser {
  return { id: u.id, username: u.username, name: u.name, picture: u.picture };
}
export function isSessionUser(value: unknown): value is SessionUser {
  if (typeof value !== "object" || value === null) return false;
  const u = value as Record<string, unknown>;
  return Number.isInteger(u.id) && Number(u.id) > 0 && typeof u.username === "string" &&
    !!u.username && typeof u.name === "string" && (u.picture === null || typeof u.picture === "string");
}
