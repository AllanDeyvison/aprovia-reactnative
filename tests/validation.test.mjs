import test from "node:test";
import assert from "node:assert/strict";
const { ValidationService } = await import("../src/utils/ValidationService.ts");

test("valida email e senha usados em cadastro/perfil", () => {
  assert.equal(ValidationService.isValidEmail("aluno@example.com"), true);
  assert.equal(ValidationService.isValidEmail("invalido"), false);
  assert.equal(ValidationService.isValidPassword("abc12345"), true);
  assert.equal(ValidationService.isValidPassword("12345678"), false);
});

test("valida formato de data esperado pelo backend", () => {
  assert.equal(ValidationService.isValidDate("1999-12-21"), true);
  assert.equal(ValidationService.isValidDate("21/12/1999"), false);
});

test("signup acusa campos essenciais inválidos", () => {
  const errors = ValidationService.validateSignup({ name: "", lastname: "", username: "a", email: "x", birthday: "21/12/1999", password: "1", confirmPassword: "2" });
  assert.ok(errors.length >= 6);
});
