import type { Message } from "../models/Message";

/** Applies a streamed chunk only to its explicitly identified assistant placeholder. */
export function appendAssistantChunk(messages: Message[], assistantMessageId: string, chunk: string) {
  let found = false;
  const next = messages.map((message) => {
    if (message.id !== assistantMessageId || message.role !== "assistant") return message;
    found = true;
    return { ...message, content: message.content + chunk, isGenerating: true };
  });
  return { found, messages: next };
}
