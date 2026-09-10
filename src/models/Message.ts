import type { SessionUser } from "./User";

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  user: SessionUser;
}

export interface ChatMessage extends Message {
  id?: string;
}
