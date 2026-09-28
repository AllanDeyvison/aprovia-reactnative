import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Bot, Calculator, Languages, Send, Sparkles, UserRound } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ChatService } from "@/services/ChatService";
import { getModelAppearance } from "@/utils/modelAppearance";
import { MarkdownMessage } from "./MarkdownMessage";
import { TtsControls } from "./TtsControls";
import { SpeechInputControl } from "./SpeechInputControl";
import * as Speech from "expo-speech";
import type { Message } from "@/models/Message";

export function ChatScreen({ chatId }: { chatId?: string }) {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const {
    currentMessages, currentChatModel, activeModel, setMessages, loadChatMessages, clearCurrentChat,
    appendToLastMessage, refreshChats, rememberChatModel, isLoadingMessages,
  } = useChat();
  const appearance = getModelAppearance(activeModel, isDark);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sendingRef = useRef(false);
  const listRef = useRef<FlatList<Message>>(null);
  const inputRef = useRef<TextInput>(null);
  const userNearBottom = useRef(true);

  useEffect(() => {
    setError(null);
    void Speech.stop();
    if (!user) return;
    if (chatId) void loadChatMessages(chatId);
    else clearCurrentChat();
  }, [chatId, user?.username]);

  const send = async () => {
    const messageText = text.trim();
    if (!user || !messageText || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setError(null);
    // Limpa antes de aguardar a API para o texto não permanecer no composer
    // enquanto a resposta da IA está sendo processada.
    setText("");
    const snapshot = currentMessages;
    const now = new Date().toISOString();
    const userMessage: Message = { role: "user", content: messageText, timestamp: now, user };
    const assistant: Message = { role: "assistant", content: "", timestamp: now, user };
    setMessages([...snapshot, userMessage, assistant]);

    try {
      const result = await ChatService.sendMessage(chatId, messageText, activeModel, appendToLastMessage);
      if (!chatId && result.chatId) {
        // O tutor que realmente criou o chat passa a pertencer a esse chat antes
        // de qualquer atualização visual do histórico/rota.
        rememberChatModel(result.chatId, activeModel);
        router.replace(`/chat/${encodeURIComponent(result.chatId)}` as any);
      }
      await refreshChats();
    } catch (e) {
      setMessages(snapshot);
      // Em falha, devolve o texto para permitir uma tentativa real sem redigitar.
      setText(messageText);
      setError(e instanceof Error ? e.message : "Não foi possível enviar. Tente novamente.");
    } finally {
      sendingRef.current = false;
      setSending(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  useEffect(() => {
    if (userNearBottom.current && currentMessages.length) requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, [currentMessages.length, currentMessages[currentMessages.length - 1]?.content]);

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: theme.colors.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View pointerEvents="none" style={[styles.accentGlow, { backgroundColor: appearance.soft }]} />
      {isLoadingMessages ? (
        <View style={styles.center}>
          <View style={[styles.loadingOrb, { backgroundColor: appearance.soft }]}><ActivityIndicator color={appearance.accent} /></View>
          <Text style={{ color: theme.colors.textSecondary, fontWeight: "650" as any }}>Carregando conversa...</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={currentMessages}
          keyExtractor={(_, i) => `${i}`}
          contentContainerStyle={currentMessages.length ? styles.list : styles.emptyList}
          keyboardShouldPersistTaps="handled"
          onScroll={({ nativeEvent }) => {
            const distance = nativeEvent.contentSize.height - (nativeEvent.contentOffset.y + nativeEvent.layoutMeasurement.height);
            userNearBottom.current = distance < 140;
          }}
          scrollEventThrottle={100}
          renderItem={({ item }) => {
            const userMessage = item.role === "user";
            return (
              <View style={[styles.messageRow, userMessage ? styles.userRow : styles.assistantRow]}>
                <View style={[styles.messageWrap, userMessage && styles.userMessageWrap]}>
                  <View style={[styles.messageMeta, userMessage && styles.userMeta]}>
                    <View style={[styles.avatarMini, { backgroundColor: userMessage ? theme.colors.primary : appearance.soft }]}>
                      {userMessage ? <UserRound size={14} color="#FFFFFF" /> : <Bot size={14} color={appearance.accent} />}
                    </View>
                    <Text style={[styles.messageAuthor, { color: theme.colors.textSecondary }]}>{userMessage ? "Você" : `AprovIA · ${appearance.label}`}</Text>
                  </View>
                  <View style={[
                    styles.bubble,
                    userMessage
                      ? { backgroundColor: theme.colors.primary }
                      : { backgroundColor: theme.colors.surface, borderColor: appearance.border, borderWidth: 1 },
                  ]}>
                    {item.content ? (
                      <MarkdownMessage value={item.content} inverted={userMessage} />
                    ) : (
                      <Text style={[styles.messageText, { color: userMessage ? "#FFFFFF" : theme.colors.text }]}>{sending ? "Pensando…" : ""}</Text>
                    )}
                  </View>
                  {!userMessage && item.content ? <TtsControls text={item.content} language={activeModel === "llama3" ? "en-US" : "pt-BR"} disabled={sending} /> : null}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyCenter}>
              <View style={[styles.heroIcon, { backgroundColor: appearance.soft, borderColor: appearance.border }]}> 
                {activeModel === "qwen2-math" ? <Calculator size={30} color={appearance.accent} /> : <Languages size={30} color={appearance.accent} />}
              </View>
              <View style={[styles.heroBadge, { backgroundColor: appearance.soft, borderColor: appearance.border }]}> 
                <Sparkles size={14} color={appearance.accent} />
                <Text style={[styles.heroBadgeText, { color: appearance.accentStrong }]}>Tutor de {appearance.label}</Text>
              </View>
              <Text style={[styles.welcome, { color: theme.colors.text }]}>Como posso ajudar hoje?</Text>
              <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>Envie uma dúvida e converse com seu tutor AprovIA de forma simples e direta.</Text>
            </View>
          }
        />
      )}

      <View style={[styles.composerArea, { backgroundColor: theme.colors.background }]}> 
        {!isLoadingMessages && chatId && !currentChatModel ? (
          <View accessibilityRole="alert" style={[styles.errorRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.warning }]}>
            <Text style={[styles.errorText, { color: theme.colors.warning }]}>Tutor deste chat não identificado pelo backend.</Text>
            <Text style={[styles.retryHint, { color: theme.colors.textSecondary }]}>Selecione o tutor pelo controle lateral antes de enviar para evitar usar o modelo errado.</Text>
          </View>
        ) : null}
        {error ? (
          <View accessibilityRole="alert" style={[styles.errorRow, { backgroundColor: theme.dark ? "rgba(239,68,68,0.10)" : "#FEF2F2", borderColor: theme.dark ? "rgba(248,113,113,0.25)" : "#FECACA" }]}> 
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
            <Text style={[styles.retryHint, { color: theme.colors.textSecondary }]}>Seu texto foi preservado. Toque em enviar para tentar novamente.</Text>
          </View>
        ) : null}
        <View style={[styles.composer, { backgroundColor: theme.colors.surface, borderColor: appearance.border, shadowColor: appearance.accent }]}> 
          <SpeechInputControl
            disabled={sending || (!!chatId && !currentChatModel)}
            language={activeModel === "llama3" ? "en-US" : "pt-BR"}
            onTranscript={(transcript) => setText((previous) => previous.trim() ? `${previous.trim()} ${transcript}` : transcript)}
          />
          <TextInput
            ref={inputRef}
            accessibilityLabel="Mensagem"
            placeholder={`Pergunte algo sobre ${appearance.label.toLowerCase()}...`}
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            value={text}
            onChangeText={setText}
            editable={!sending && (!chatId || !!currentChatModel)}
            style={[styles.input, { color: theme.colors.text }]}
            returnKeyType={Platform.OS === "web" ? "send" : "default"}
            onKeyPress={(event: any) => {
              if (Platform.OS !== "web") return;
              if (event.nativeEvent?.key !== "Enter" || event.nativeEvent?.shiftKey) return;
              event.preventDefault?.();
              if (!sendingRef.current && text.trim()) void send();
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enviar mensagem"
            disabled={sending || !text.trim() || (!!chatId && !currentChatModel)}
            onPress={send}
            style={({ pressed }) => [styles.send, { backgroundColor: appearance.accent, opacity: sending || !text.trim() || (!!chatId && !currentChatModel) ? 0.42 : pressed ? 0.82 : 1 }]}
          >
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Send size={19} color="#fff" />}
          </Pressable>
        </View>
        <Text style={[styles.composerHint, { color: theme.colors.textSecondary }]}>AprovIA pode cometer erros. Confira informações importantes.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: "relative", overflow: "hidden" },
  accentGlow: { position: "absolute", top: -190, right: -160, width: 430, height: 430, borderRadius: 215, opacity: 0.7 },
  list: { width: "100%", maxWidth: 940, alignSelf: "center", paddingHorizontal: 20, paddingTop: 26, paddingBottom: 30 },
  emptyList: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 11 },
  loadingOrb: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  emptyCenter: { alignItems: "center", justifyContent: "center", width: "100%", maxWidth: 580 },
  heroIcon: { width: 72, height: 72, borderRadius: 24, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  heroBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, borderWidth: 1, marginBottom: 13 },
  heroBadgeText: { fontSize: 12, fontWeight: "850" as any },
  welcome: { fontSize: 31, fontWeight: "900", letterSpacing: -0.65, textAlign: "center" },
  hint: { fontSize: 15, lineHeight: 22, textAlign: "center", maxWidth: 500, marginTop: 9 },
  messageRow: { width: "100%", marginVertical: 9 },
  userRow: { alignItems: "flex-end" },
  assistantRow: { alignItems: "flex-start" },
  messageWrap: { maxWidth: "84%" },
  userMessageWrap: { alignItems: "flex-end" },
  messageMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6, paddingHorizontal: 3 },
  userMeta: { flexDirection: "row-reverse" },
  avatarMini: { width: 25, height: 25, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  messageAuthor: { fontSize: 11, fontWeight: "750" as any },
  bubble: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 13, shadowColor: "#000", shadowOpacity: 0.035, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  messageText: { lineHeight: 22, fontSize: 15 },
  composerArea: { paddingHorizontal: 14, paddingTop: 9, paddingBottom: 10 },
  composer: { width: "100%", maxWidth: 920, alignSelf: "center", minHeight: 60, maxHeight: 170, borderWidth: 1.2, borderRadius: 22, flexDirection: "row", alignItems: "flex-end", padding: 8, shadowOpacity: 0.09, shadowRadius: 18, shadowOffset: { width: 0, height: 7 }, elevation: 2 },
  input: { flex: 1, minHeight: 42, maxHeight: 145, paddingHorizontal: 10, paddingVertical: 10, fontSize: 16, outlineStyle: "none" } as any,
  send: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  composerHint: { fontSize: 10.5, textAlign: "center", marginTop: 6 },
  errorRow: { width: "100%", maxWidth: 920, alignSelf: "center", borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 8 },
  errorText: { fontWeight: "800", fontSize: 12 },
  retryHint: { fontSize: 11, marginTop: 2 },
});
