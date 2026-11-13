import type { SessionUser } from "./User";

export interface Message {
  /** Local stable identity. The API does not provide message ids for every history item. */
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  user: SessionUser;
  /** True only for the local assistant placeholder while its request is streaming. */
  isGenerating?: boolean;
}

export type ChatMessage = Omit<Message, "id"> & { id?: string };
