import test from "node:test";
import assert from "node:assert/strict";
const { appendAssistantChunk } = await import("../src/utils/messageStreaming.ts");

const user = { id: "u" };
const messages = [
  { id: "user-1", role: "user", content: "how are you?", timestamp: "now", user },
  { id: "assistant-1", role: "assistant", content: "", timestamp: "now", user, isGenerating: true },
];

test("chunks controlados só atualizam o placeholder do assistente", () => {
  const first = appendAssistantChunk(messages, "assistant-1", "I am ");
  const second = appendAssistantChunk(first.messages, "assistant-1", "well.");
  assert.equal(second.found, true);
  assert.equal(second.messages[0].content, "how are you?");
  assert.equal(second.messages[1].content, "I am well.");
});

test("chunk atrasado sem alvo não é anexado à pergunta", () => {
  const stale = appendAssistantChunk([messages[0]], "assistant-1", "should not appear");
  assert.equal(stale.found, false);
  assert.equal(stale.messages[0].content, "how are you?");
});
