import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Chat } from "../models/Chat";
import { Message } from "../models/Message";
import { ChatService } from "../services/ChatService";
import { NotificationService } from "../services/NotificationService";
import { useModel } from "./ModelContext";
import type { AprovIAModel } from "../utils/modelAppearance";
import { resolveChatModel } from "../utils/chatModel";

interface ChatContextType {
  chats: Chat[];
  currentChatId: string | null;
  currentChatModel: AprovIAModel | null;
  activeModel: AprovIAModel;
  currentMessages: Message[];
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
  chatsError: string | null;
  setCurrentChat: (chatId: string | null) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  refreshChats: () => Promise<void>;
  loadChatMessages: (chatId: string) => Promise<void>;
  addMessage: (message: Message) => void;
  appendToLastMessage: (chunk: string) => void;
  deleteChat: (chatId: string) => Promise<void>;
  clearCurrentChat: () => void;
  changeActiveModel: (model: AprovIAModel) => Promise<void>;
  rememberChatModel: (chatId: string, model: AprovIAModel) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { model, setModel } = useModel();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [currentChatModel, setCurrentChatModel] = useState<AprovIAModel | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [chatsError, setChatsError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const refreshRequestRef = useRef(0);
  const messagesRequestRef = useRef(0);
  const chatModelCacheRef = useRef<Map<string, AprovIAModel>>(new Map());

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const rememberChatModel = useCallback((chatId: string, nextModel: AprovIAModel) => {
    chatModelCacheRef.current.set(chatId, nextModel);
    if (!mountedRef.current) return;
    setChats((prev) => prev.map((chat) => chat.chat_id === chatId ? { ...chat, model: nextModel } : chat));
    if (currentChatId === chatId) setCurrentChatModel(nextModel);
  }, [currentChatId]);

  const enrichChatModel = useCallback(async (chat: Chat): Promise<Chat> => {
    const direct = resolveChatModel(chat);
    if (direct) {
      chatModelCacheRef.current.set(chat.chat_id, direct);
      return { ...chat, model: direct };
    }

    const cached = chatModelCacheRef.current.get(chat.chat_id);
    if (cached) return { ...chat, model: cached };

    try {
      const details = await ChatService.getChatDetails(chat.chat_id);
      const detailedModel = resolveChatModel(details);
      if (detailedModel) {
        chatModelCacheRef.current.set(chat.chat_id, detailedModel);
        return { ...chat, model: detailedModel };
      }
    } catch {
      // O histórico continua utilizável mesmo se o detalhe de um item falhar.
    }
    return chat;
  }, []);

  const refreshChats = useCallback(async () => {
    const requestId = ++refreshRequestRef.current;
    if (mountedRef.current) {
      setIsLoadingChats(true);
      setChatsError(null);
    }
    try {
      const nextChats = (await ChatService.getChats()) || [];
      const enriched = await Promise.all(nextChats.map(enrichChatModel));
      if (mountedRef.current && requestId === refreshRequestRef.current) {
        // Preserve the order exactly as returned by the backend.
        setChats(enriched);
        if (currentChatId) {
          const activeChat = enriched.find((chat) => chat.chat_id === currentChatId);
          const activeChatModel = activeChat ? resolveChatModel(activeChat) : null;
          if (activeChatModel) {
            setCurrentChatModel(activeChatModel);
            await setModel(activeChatModel);
          }
        }
      }
    } catch (error) {
      if (mountedRef.current && requestId === refreshRequestRef.current) {
        setChatsError((error as Error).message || "Erro ao carregar chats");
      }
    } finally {
      if (mountedRef.current && requestId === refreshRequestRef.current) {
        setIsLoadingChats(false);
      }
    }
  }, [currentChatId, enrichChatModel, setModel]);

  const loadChatMessages = useCallback(async (chatId: string) => {
    const requestId = ++messagesRequestRef.current;
    try {
      const cachedModel = chatModelCacheRef.current.get(chatId) ?? null;
      if (mountedRef.current) {
        setIsLoadingMessages(true);
        setCurrentChatId(chatId);
        setCurrentChatModel(cachedModel);
        if (cachedModel) void setModel(cachedModel);
      }

      const raw = await ChatService.getChatDetails(chatId);
      if (!mountedRef.current || requestId !== messagesRequestRef.current) return;

      const rawMessages = raw?.messages ?? raw ?? [];
      const resolvedModel = resolveChatModel(raw) ?? chatModelCacheRef.current.get(chatId) ?? null;

      setCurrentMessages(Array.isArray(rawMessages) ? rawMessages : []);
      setCurrentChatId(chatId);
      setCurrentChatModel(resolvedModel);

      if (resolvedModel) {
        chatModelCacheRef.current.set(chatId, resolvedModel);
        setChats((prev) => prev.map((chat) => chat.chat_id === chatId ? { ...chat, model: resolvedModel } : chat));
        await setModel(resolvedModel);
      }
    } catch (error) {
      if (!mountedRef.current || requestId !== messagesRequestRef.current) return;
      NotificationService.error((error as Error).message || "Erro ao carregar mensagens");
      throw error;
    } finally {
      if (mountedRef.current && requestId === messagesRequestRef.current) {
        setIsLoadingMessages(false);
      }
    }
  }, [setModel]);

  const addMessage = useCallback((message: Message) => {
    setCurrentMessages((prev) => [...prev, message]);
  }, []);

  const appendToLastMessage = useCallback((chunk: string) => {
    setCurrentMessages((prev) => {
      if (!prev.length) return prev;
      const next = [...prev];
      const index = next.length - 1;
      next[index] = { ...next[index], content: next[index].content + chunk };
      return next;
    });
  }, []);

  const deleteChat = useCallback(async (chatId: string) => {
    await ChatService.deleteChat(chatId);
    chatModelCacheRef.current.delete(chatId);
    if (!mountedRef.current) return;
    setChats((prev) => prev.filter((c) => c.chat_id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
      setCurrentChatModel(null);
      setCurrentMessages([]);
    }
  }, [currentChatId]);

  const setCurrentChat = useCallback((chatId: string | null) => {
    setCurrentChatId(chatId);
    if (!chatId) {
      setCurrentChatModel(null);
      setCurrentMessages([]);
    } else {
      setCurrentChatModel(chatModelCacheRef.current.get(chatId) ?? null);
    }
  }, []);

  const clearCurrentChat = useCallback(() => {
    messagesRequestRef.current += 1;
    setCurrentChatId(null);
    setCurrentChatModel(null);
    setCurrentMessages([]);
    setIsLoadingMessages(false);
  }, []);

  const changeActiveModel = useCallback(async (nextModel: AprovIAModel) => {
    if (currentChatId) {
      chatModelCacheRef.current.set(currentChatId, nextModel);
      setCurrentChatModel(nextModel);
      setChats((prev) => prev.map((chat) => chat.chat_id === currentChatId ? { ...chat, model: nextModel } : chat));
    }
    await setModel(nextModel);
  }, [currentChatId, setModel]);

  const activeModel = useMemo<AprovIAModel>(() => currentChatModel ?? model, [currentChatModel, model]);

  return (
    <ChatContext.Provider value={{
      chats, currentChatId, currentChatModel, activeModel, currentMessages, isLoadingChats, isLoadingMessages, chatsError,
      setCurrentChat, setMessages: setCurrentMessages, refreshChats, loadChatMessages,
      addMessage, appendToLastMessage, deleteChat, clearCurrentChat, changeActiveModel, rememberChatModel,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat deve ser usado dentro de ChatProvider");
  return context;
};
