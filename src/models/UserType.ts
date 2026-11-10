export const UserType = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;

export type UserType = (typeof UserType)[keyof typeof UserType];
export type Role = UserType;

export function isUserType(value: unknown): value is UserType {
  return value === UserType.USER || value === UserType.ADMIN;
}
