import test from "node:test";
import assert from "node:assert/strict";

const { UserType, isUserType } = await import("../src/models/UserType.ts");

test("aceita somente os papéis maiúsculos do contrato", () => {
  assert.equal(isUserType(UserType.USER), true);
  assert.equal(isUserType(UserType.ADMIN), true);
  assert.equal(isUserType("admin"), false);
  assert.equal(isUserType("MODERATOR"), false);
  assert.equal(isUserType(undefined), false);
});
