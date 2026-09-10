import type { AprovIAModel } from "./modelAppearance";

const MODEL_KEYS = ["model", "tutor", "tutor_model", "model_name"] as const;

export function isAprovIAModel(value: unknown): value is AprovIAModel {
  return value === "llama3" || value === "qwen2-math";
}

function fromObject(value: unknown): AprovIAModel | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  for (const key of MODEL_KEYS) {
    if (isAprovIAModel(record[key])) return record[key];
  }
  return null;
}

export function resolveChatModel(value: unknown): AprovIAModel | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const model = fromObject(item);
      if (model) return model;
    }
    return null;
  }

  const direct = fromObject(value);
  if (direct) return direct;

  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const messages = Array.isArray(record.messages) ? record.messages : [];
  for (const message of messages) {
    const model = fromObject(message);
    if (model) return model;
  }
  return null;
}
