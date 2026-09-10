import test from "node:test";
import assert from "node:assert/strict";
const { isAprovIAModel, resolveChatModel } = await import("../src/utils/chatModel.ts");

test("preserva somente IDs reais dos tutores", () => {
  assert.equal(isAprovIAModel("llama3"), true);
  assert.equal(isAprovIAModel("qwen2-math"), true);
  assert.equal(isAprovIAModel("english"), false);
  assert.equal(isAprovIAModel("math"), false);
});

test("resolve modelo real do chat sem inferir pelo título", () => {
  assert.equal(resolveChatModel({ title: "Tell me colors", model: "qwen2-math" }), "qwen2-math");
  assert.equal(resolveChatModel({ title: "Equação", messages: [{ tutor_model: "llama3" }] }), "llama3");
  assert.equal(resolveChatModel({ title: "English title only" }), null);
});
