import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Slot, usePathname, useRouter } from "expo-router";
import {
  Calculator,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  History,
  Languages,
  LogOut,
  Menu,
  MessageSquare,
  MessageSquarePlus,
  Moon,
  RefreshCw,
  Sun,
  Trash2,
  UserRound,
  X,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar } from "@/components/ui/Avatar";
import { getModelAppearance } from "@/utils/modelAppearance";
import { resolveChatModel } from "@/utils/chatModel";

const WIDE = 900;

function getChatIdFromPath(pathname: string) {
  const match = pathname.match(/^\/chat\/([^/]+)$/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

async function confirmChatDeletion(title: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.confirm(`Excluir \"${title}\"? Esta ação não pode ser desfeita.`);
  }
  return new Promise<boolean>((resolve) => {
    Alert.alert(
      "Excluir conversa",
      `Deseja excluir \"${title}\"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
        { text: "Excluir", style: "destructive", onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}

export function AppShell() {
  const { width } = useWindowDimensions();
  const persistent = width >= WIDE;
  const [open, setOpen] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user, handleLogout, isSigningOut } = useAuth();
  const {
    chats,
    currentChatId,
    isLoadingChats,
    chatsError,
    refreshChats,
    deleteChat,
    clearCurrentChat,
    activeModel,
    changeActiveModel,
  } = useChat();
  const { theme, isDark, toggleTheme } = useTheme();
  const appearance = getModelAppearance(activeModel, isDark);
  const routeChatId = getChatIdFromPath(pathname);
  // A URL/deep link é a fonte mais imediata para a seleção visual.
  const activeChatId = routeChatId ?? currentChatId;

  useEffect(() => {
    if (user?.username) void refreshChats();
  }, [user?.username, refreshChats]);

  useEffect(() => {
    if (open && user?.username) void refreshChats();
  }, [open, user?.username, refreshChats]);

  const go = (href: "/profile" | "/help") => {
    setOpen(false);
    router.push(href as any);
  };

  const startNewChat = () => {
    clearCurrentChat();
    setDeleteError(null);
    setOpen(false);
    router.replace("/chat" as any);
  };

  const toggleHistory = () => {
    const next = !historyExpanded;
    setHistoryExpanded(next);
    setDeleteError(null);
    if (next && user?.username) void refreshChats();
  };

  const openChat = (chatId: string) => {
    setDeleteError(null);
    setOpen(false);
    router.push(`/chat/${encodeURIComponent(chatId)}` as any);
  };

  const removeChat = async (chatId: string, title: string) => {
    if (!user?.username || deletingIds.has(chatId)) return;
    if (!(await confirmChatDeletion(title))) return;

    const wasActive = activeChatId === chatId;
    setDeleteError(null);
    setDeletingIds((prev) => new Set(prev).add(chatId));
    try {
      await deleteChat(chatId);
      if (wasActive) {
        clearCurrentChat();
        setOpen(false);
        router.replace("/chat" as any);
      }
      await refreshChats();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Não foi possível excluir a conversa.");
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(chatId);
        return next;
      });
    }
  };

  const logout = async () => {
    setOpen(false);
    await handleLogout();
    router.replace("/login");
  };

  const initials = (user?.name || user?.username || "U").slice(0, 2).toUpperCase();

  const menu = (
    <View style={[styles.sidebar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
      <View style={styles.brandRow}>
        <View style={styles.brandIdentity}>
          <Image source={require("../../../assets/images/icone-aprovia.png")} style={styles.brandLogo} resizeMode="contain" accessibilityIgnoresInvertColors />
          <View>
            <Text style={[styles.brand, { color: theme.colors.primary }]}>Aprov<Text style={{ color: appearance.accent }}>IA</Text></Text>
            <Text style={[styles.brandCaption, { color: theme.colors.textSecondary }]}>Tutor inteligente</Text>
          </View>
        </View>
        {!persistent ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Fechar menu" hitSlop={10} onPress={() => setOpen(false)} style={[styles.iconButton, { backgroundColor: theme.colors.surfaceVariant }]}>
            <X size={22} color={theme.colors.text} />
          </Pressable>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Novo chat"
        onPress={startNewChat}
        style={({ pressed }) => [styles.newChat, { backgroundColor: theme.colors.primary, opacity: pressed ? 0.88 : 1 }]}
      >
        <View style={styles.newChatIcon}><MessageSquarePlus size={19} color="#FFFFFF" /></View>
        <Text style={styles.newChatText}>Novo chat</Text>
      </Pressable>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>NAVEGAÇÃO</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={historyExpanded ? "Recolher histórico" : "Abrir histórico"}
          accessibilityState={{ expanded: historyExpanded }}
          onPress={toggleHistory}
          style={({ pressed }) => [styles.menuItem, { backgroundColor: historyExpanded ? appearance.soft : pressed ? theme.colors.surfaceVariant : "transparent" }]}
        >
          <History size={20} color={historyExpanded ? appearance.accent : theme.colors.textSecondary} />
          <Text style={[styles.menuText, { color: historyExpanded ? appearance.accent : theme.colors.text }]}>Histórico</Text>
          <View style={styles.historyActions}>
            {isLoadingChats ? <ActivityIndicator size="small" color={appearance.accent} /> : null}
            {historyExpanded ? <ChevronDown size={17} color={appearance.accent} /> : <ChevronRight size={17} color={theme.colors.textSecondary} />}
          </View>
        </Pressable>

        {historyExpanded ? (
          <View style={[styles.historyPanel, { borderColor: theme.colors.border }]}> 
            {chatsError ? (
              <View style={styles.historyState}>
                <Text style={[styles.historyError, { color: theme.colors.error }]}>{chatsError}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Tentar carregar histórico novamente"
                  onPress={() => user?.username && void refreshChats()}
                  style={({ pressed }) => [styles.retryButton, { backgroundColor: theme.colors.surfaceVariant, opacity: pressed ? 0.75 : 1 }]}
                >
                  <RefreshCw size={14} color={theme.colors.text} />
                  <Text style={[styles.retryText, { color: theme.colors.text }]}>Tentar novamente</Text>
                </Pressable>
              </View>
            ) : isLoadingChats && chats.length === 0 ? (
              <View style={styles.historyState}>
                <ActivityIndicator size="small" color={appearance.accent} />
                <Text style={[styles.historyStateText, { color: theme.colors.textSecondary }]}>Carregando conversas...</Text>
              </View>
            ) : chats.length === 0 ? (
              <View style={styles.historyState}>
                <MessageSquare size={18} color={theme.colors.textSecondary} />
                <Text style={[styles.historyStateText, { color: theme.colors.textSecondary }]}>Nenhuma conversa ainda.</Text>
              </View>
            ) : (
              <ScrollView style={styles.historyScroll} contentContainerStyle={styles.historyList} nestedScrollEnabled showsVerticalScrollIndicator>
                {chats.map((chat) => {
                  const active = activeChatId === chat.chat_id;
                  const deleting = deletingIds.has(chat.chat_id);
                  const hovered = hoveredChatId === chat.chat_id;
                  const title = chat.title?.trim() || `Conversa ${chat.chat_id}`;
                  const chatModel = resolveChatModel(chat);
                  const chatAppearance = chatModel ? getModelAppearance(chatModel, isDark) : null;
                  const tutorLabel = chatAppearance?.label ?? "Tutor não identificado";
                  const itemAccent = chatAppearance?.accent ?? theme.colors.textSecondary;
                  const itemStrong = chatAppearance?.accentStrong ?? theme.colors.text;
                  const itemSoft = chatAppearance?.soft ?? theme.colors.surfaceVariant;
                  const itemBorder = chatAppearance?.border ?? theme.colors.border;
                  return (
                    <View
                      key={chat.chat_id}
                      style={[
                        styles.historyItem,
                        {
                          backgroundColor: active ? itemSoft : hovered ? theme.colors.surfaceVariant : "transparent",
                          borderColor: active ? itemBorder : hovered ? theme.colors.border : "transparent",
                          opacity: deleting ? 0.65 : 1,
                        },
                      ]}
                    >
                      <View style={[styles.historyActiveBar, { backgroundColor: active ? itemAccent : "transparent" }]} />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Abrir chat ${title}`}
                        accessibilityState={{ selected: active, disabled: deleting }}
                        disabled={deleting}
                        onPress={() => openChat(chat.chat_id)}
                        onHoverIn={() => Platform.OS === "web" && setHoveredChatId(chat.chat_id)}
                        onHoverOut={() => Platform.OS === "web" && setHoveredChatId((value) => value === chat.chat_id ? null : value)}
                        style={({ pressed }) => [styles.historyMainArea, { backgroundColor: pressed && !active ? theme.colors.surfaceVariant : "transparent" }]}
                      >
                        <View style={styles.historyContent}>
                          <View style={styles.historyTitleRow}>
                            {chatModel === "qwen2-math" ? (
                              <Calculator size={14} color={itemAccent} />
                            ) : chatModel === "llama3" ? (
                              <Languages size={14} color={itemAccent} />
                            ) : (
                              <MessageSquare size={14} color={theme.colors.textSecondary} />
                            )}
                            <Text numberOfLines={1} style={[styles.historyTitle, { color: active ? itemStrong : theme.colors.text }]}>{title}</Text>
                          </View>
                          <View style={[styles.tutorBadge, { backgroundColor: chatAppearance ? itemSoft : theme.colors.surfaceVariant, borderColor: chatAppearance ? itemBorder : theme.colors.border }]}>
                            <Text numberOfLines={1} style={[styles.tutorBadgeText, { color: chatAppearance ? itemStrong : theme.colors.textSecondary }]}>{tutorLabel}</Text>
                          </View>
                        </View>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Excluir chat ${title}`}
                        disabled={deleting}
                        hitSlop={8}
                        onPress={() => void removeChat(chat.chat_id, title)}
                        style={({ pressed }) => [styles.deleteButton, { backgroundColor: pressed ? theme.colors.surfaceVariant : "transparent" }]}
                      >
                        {deleting ? <ActivityIndicator size="small" color={theme.colors.error} /> : <Trash2 size={15} color={theme.colors.error} />}
                      </Pressable>
                    </View>
                  );
                })}
              </ScrollView>
            )}
            {deleteError ? <Text accessibilityRole="alert" style={[styles.deleteError, { color: theme.colors.error }]}>{deleteError}</Text> : null}
          </View>
        ) : null}

        <MenuItem label="Perfil" icon={<UserRound size={20} />} active={pathname === "/profile"} onPress={() => go("/profile")} theme={theme} activeColor={appearance.accent} activeSoft={appearance.soft} />
        <MenuItem label="Ajuda" icon={<CircleHelp size={20} />} active={pathname === "/help"} onPress={() => go("/help")} theme={theme} activeColor={appearance.accent} activeSoft={appearance.soft} />
      </View>

      <View style={styles.menuBottom}>
        <TutorSwitch
          currentModel={activeModel}
          onToggle={() => void changeActiveModel(activeModel === "qwen2-math" ? "llama3" : "qwen2-math")}
          isDark={isDark}
          theme={theme}
        />

        <Pressable accessibilityRole="button" accessibilityLabel="Alternar tema" onPress={toggleTheme} style={({ pressed }) => [styles.utilityItem, { backgroundColor: pressed ? theme.colors.surfaceVariant : "transparent" }]}>
          <View style={[styles.utilityIcon, { backgroundColor: theme.colors.surfaceVariant }]}>{isDark ? <Sun size={18} color={theme.colors.text} /> : <Moon size={18} color={theme.colors.text} />}</View>
          <Text style={[styles.utilityText, { color: theme.colors.text }]}>{isDark ? "Tema claro" : "Tema escuro"}</Text>
        </Pressable>

        <View style={[styles.userCard, { borderColor: theme.colors.border }]}> 
          <Avatar uri={user?.picture || undefined} initials={initials} size="small" />
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.colors.text }]} numberOfLines={1}>{user?.name || "Usuário"}</Text>
            <Text style={[styles.userHandle, { color: theme.colors.textSecondary }]} numberOfLines={1}>@{user?.username || "usuario"}</Text>
          </View>
          <Pressable disabled={isSigningOut} accessibilityRole="button" accessibilityLabel="Sair" onPress={logout} style={({ pressed }) => [styles.logoutButton, { backgroundColor: pressed ? theme.colors.surfaceVariant : "transparent", opacity: isSigningOut ? 0.5 : 1 }]}>
            <LogOut size={18} color={theme.colors.error} />
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}> 
      <View style={styles.root}>
        {persistent ? menu : null}
        <View style={styles.main}>
          <View style={[styles.header, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}> 
            {!persistent ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Abrir menu" hitSlop={10} onPress={() => setOpen(true)} style={[styles.iconButton, { backgroundColor: theme.colors.surface }]}> 
                <Menu size={23} color={theme.colors.text} />
              </Pressable>
            ) : <View style={styles.iconPlaceholder} />}
            <View style={styles.headerBrand}>
              <Text accessibilityRole="header" style={[styles.headerTitle, { color: theme.colors.text }]}>AprovIA</Text>
              <View style={[styles.statusDot, { backgroundColor: appearance.accent }]} />
            </View>
            <View style={[styles.modelBadge, { backgroundColor: appearance.soft, borderColor: appearance.border }]}> 
              {activeModel === "qwen2-math" ? <Calculator size={15} color={appearance.accent} /> : <Languages size={15} color={appearance.accent} />}
              <Text style={[styles.modelText, { color: appearance.accentStrong }]}>{appearance.label}</Text>
            </View>
          </View>
          <View style={styles.content}><Slot /></View>
        </View>
      </View>

      {!persistent ? (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <View style={styles.modalRoot}>
            <Pressable accessibilityLabel="Fechar menu" style={styles.backdrop} onPress={() => setOpen(false)} />
            <View style={styles.mobileMenu}>{menu}</View>
          </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

function MenuItem({ label, icon, active, onPress, theme, activeColor, activeSoft }: any) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.menuItem, { backgroundColor: active ? activeSoft : pressed ? theme.colors.surfaceVariant : "transparent" }]}
    >
      {React.cloneElement(icon, { color: active ? activeColor : theme.colors.textSecondary })}
      <Text style={[styles.menuText, { color: active ? activeColor : theme.colors.text }]}>{label}</Text>
      {active ? <View style={[styles.activePill, { backgroundColor: activeColor }]} /> : null}
    </Pressable>
  );
}

function TutorSwitch({ currentModel, onToggle, isDark, theme }: any) {
  const destination = currentModel === "qwen2-math" ? "llama3" : "qwen2-math";
  const destinationAppearance = getModelAppearance(destination, isDark);
  const destinationLabel = destinationAppearance.label;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Trocar para ${destinationLabel}`}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.tutorSwitch,
        {
          backgroundColor: destinationAppearance.soft,
          borderColor: destinationAppearance.border,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <View style={[styles.tutorSwitchIcon, { backgroundColor: theme.colors.surface }]}>
        {destination === "qwen2-math"
          ? <Calculator size={17} color={destinationAppearance.accent} />
          : <Languages size={17} color={destinationAppearance.accent} />}
      </View>
      <View style={styles.tutorSwitchCopy}>
        <Text style={[styles.tutorSwitchEyebrow, { color: theme.colors.textSecondary }]}>TROCAR PARA</Text>
        <Text style={[styles.tutorSwitchLabel, { color: destinationAppearance.accentStrong }]}>{destinationLabel}</Text>
      </View>
      <Text style={[styles.tutorSwitchArrow, { color: destinationAppearance.accent }]}>⇄</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  root: { flex: 1, flexDirection: "row" },
  sidebar: { width: 292, height: "100%", borderRightWidth: 1, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 14 },
  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 62, paddingHorizontal: 5 },
  brandIdentity: { flexDirection: "row", alignItems: "center", gap: 9, flexShrink: 1 },
  brandLogo: { width: 42, height: 42 },
  brand: { fontSize: 28, fontWeight: "900", letterSpacing: -1 },
  brandCaption: { fontSize: 11, fontWeight: "700", marginTop: 1 },
  newChat: { minHeight: 52, borderRadius: 17, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", marginTop: 17, shadowColor: "#7C3AED", shadowOpacity: 0.22, shadowRadius: 16, shadowOffset: { width: 0, height: 7 }, elevation: 4 },
  newChatIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginRight: 10 },
  newChatText: { color: "#FFFFFF", fontSize: 15, fontWeight: "850" as any },
  section: { marginTop: 28, gap: 4, flex: 1, minHeight: 0 },
  sectionLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginBottom: 6, paddingHorizontal: 10 },
  menuBottom: { marginTop: "auto", gap: 7 },
  menuItem: { minHeight: 48, borderRadius: 14, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 11, position: "relative" },
  menuText: { fontSize: 14, fontWeight: "700", flexShrink: 1 },
  activePill: { position: "absolute", right: 9, width: 5, height: 5, borderRadius: 3 },
  historyActions: { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 7 },
  historyPanel: { marginTop: 2, marginBottom: 5, marginLeft: 5, borderLeftWidth: 1, paddingLeft: 7, maxHeight: 300, flexShrink: 1 },
  historyScroll: { maxHeight: 260, flexShrink: 1 },
  historyList: { paddingVertical: 3, gap: 3 },
  historyItem: { minHeight: 58, borderRadius: 13, borderWidth: 1, paddingLeft: 4, paddingRight: 5, flexDirection: "row", alignItems: "center", gap: 3, position: "relative", overflow: "hidden" },
  historyMainArea: { flex: 1, minWidth: 0, alignSelf: "stretch", justifyContent: "center", paddingLeft: 6, paddingVertical: 7, borderRadius: 11 },
  historyActiveBar: { position: "absolute", left: 0, top: 7, bottom: 7, width: 3, borderRadius: 2 },
  historyContent: { flex: 1, minWidth: 0, gap: 4 },
  historyTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, minWidth: 0 },
  historyTitle: { flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: "700" },
  tutorBadge: { alignSelf: "flex-start", maxWidth: "100%", borderWidth: 1, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  tutorBadgeText: { fontSize: 9.5, fontWeight: "800" },
  deleteButton: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  historyState: { minHeight: 74, paddingHorizontal: 8, paddingVertical: 10, alignItems: "center", justifyContent: "center", gap: 7 },
  historyStateText: { fontSize: 11.5, textAlign: "center" },
  historyError: { fontSize: 11.5, fontWeight: "700", textAlign: "center" },
  retryButton: { minHeight: 34, borderRadius: 10, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 6 },
  retryText: { fontSize: 11.5, fontWeight: "750" as any },
  deleteError: { fontSize: 11, fontWeight: "700", paddingHorizontal: 8, paddingVertical: 5 },
  tutorSwitch: { minHeight: 54, borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 2 },
  tutorSwitchIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  tutorSwitchCopy: { flex: 1, minWidth: 0 },
  tutorSwitchEyebrow: { fontSize: 8.5, fontWeight: "900", letterSpacing: 0.8 },
  tutorSwitchLabel: { fontSize: 13, fontWeight: "850" as any, marginTop: 1 },
  tutorSwitchArrow: { fontSize: 19, fontWeight: "900" },
  utilityItem: { minHeight: 45, borderRadius: 13, flexDirection: "row", alignItems: "center", paddingHorizontal: 6, gap: 9 },
  utilityIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  utilityText: { fontSize: 13, fontWeight: "700" },
  userCard: { minHeight: 58, borderTopWidth: 1, marginTop: 3, paddingTop: 10, paddingHorizontal: 4, flexDirection: "row", alignItems: "center" },
  userInfo: { flex: 1, minWidth: 0, marginLeft: 9 },
  userName: { fontSize: 13, fontWeight: "800" },
  userHandle: { fontSize: 11, marginTop: 1 },
  logoutButton: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  main: { flex: 1, minWidth: 0 },
  header: { minHeight: 66, borderBottomWidth: 1, paddingHorizontal: 17, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerBrand: { flexDirection: "row", alignItems: "center", gap: 7 },
  headerTitle: { fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  iconButton: { width: 43, height: 43, alignItems: "center", justifyContent: "center", borderRadius: 14 },
  iconPlaceholder: { width: 43 },
  modelBadge: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  modelText: { fontSize: 12, fontWeight: "850" as any },
  content: { flex: 1 },
  modalRoot: { flex: 1, flexDirection: "row" },
  backdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(15,23,42,0.52)" },
  mobileMenu: { width: 300, maxWidth: "84%", height: "100%" },
});
