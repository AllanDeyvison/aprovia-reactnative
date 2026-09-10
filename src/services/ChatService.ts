import { Platform } from "react-native";
import { chatApi, CHAT_API_URL } from "./api";
import { Chat } from "../models/Chat";

function requireChatApiUrl() {
  const value = CHAT_API_URL?.trim().replace(/\/+$/, "");
  if (!value) throw new Error("Configure EXPO_PUBLIC_CHAT_API e reinicie o Expo.");
  return value;
}

function getChatId(headers: Headers): string | undefined {
  const direct = headers.get("x-chat-id") || headers.get("X-Chat-ID");
  if (direct) return direct;
  let found: string | undefined;
  headers.forEach((value, key) => {
    if (key.toLowerCase() === "x-chat-id") found = value;
  });
  return found;
}

export const ChatService = {
  async getChats(userId: string): Promise<Chat[]> {
    try {
      const response = await chatApi.get("/chats", { params: { user_id: userId } });
      return response.data || [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Erro ao carregar chats");
    }
  },

  async getChatDetails(chatId: string, userId: string) {
    try {
      const response = await chatApi.get(`/chats/${chatId}`, {
        params: { user_id: userId },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Erro ao carregar mensagens");
    }
  },

  async getChatMessages(chatId: string, userId: string) {
    const data = await this.getChatDetails(chatId, userId);
    return data?.messages ?? data ?? [];
  },

  async deleteChat(chatId: string, userId: string): Promise<void> {
    try {
      await chatApi.delete(`/chats/${chatId}/delete`, { params: { user_id: userId } });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Erro ao deletar chat");
    }
  },

  async sendMessage(
    chatId: string | undefined,
    message: string,
    model: string,
    userId: string,
    onChunk?: (chunk: string) => void
  ): Promise<{ response: string; chatId?: string; streamed: boolean }> {
    const endpoint = chatId ? `/chats/${chatId}/add` : "/chats/new";
    const url = `${requireChatApiUrl()}${endpoint}?user_id=${encodeURIComponent(userId)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, model }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Erro ao enviar mensagem (${response.status})`);
    }

    const newChatId = getChatId(response.headers) || chatId;
    const body = response.body as ReadableStream<Uint8Array> | null;
    const canStream = !!body && typeof (body as any).getReader === "function" && typeof TextDecoder !== "undefined";

    if (canStream) {
      const reader = body!.getReader();
      const decoder = new TextDecoder();
      let full = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!value) continue;
          const chunk = decoder.decode(value, { stream: true });
          if (!chunk) continue;
          full += chunk;
          onChunk?.(chunk);
        }
        const tail = decoder.decode();
        if (tail) {
          full += tail;
          onChunk?.(tail);
        }
      } finally {
        reader.releaseLock();
      }
      return { response: full, chatId: newChatId, streamed: true };
    }

    // React Native runtimes without ReadableStream/getReader use the real completed
    // HTTP response as fallback. No timer or simulated streaming is used.
    const text = await response.text();
    let finalText = text;
    try {
      const parsed = JSON.parse(text);
      finalText = parsed?.answer ?? parsed?.response ?? parsed?.message ?? text;
    } catch {
      // Plain-text response is valid for this backend.
    }
    if (finalText) onChunk?.(finalText);
    if (__DEV__ && Platform.OS !== "web") {
      console.info("Chat: runtime nativo sem stream legível; usando resposta completa.");
    }
    return { response: finalText, chatId: newChatId, streamed: false };
  },
};
