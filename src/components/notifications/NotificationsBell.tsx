import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell, X } from "lucide-react-native";
import { usePushNotifications } from "@/contexts/PushNotificationsContext";
import { useTheme } from "@/contexts/ThemeContext";

export function NotificationsBell() {
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { notices, unread, enable, markAllRead, open } = usePushNotifications();
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activate = async () => setError(await enable());
  const panelWidth = Math.min(340, Math.max(0, width - 24));
  const panelHeight = Math.max(180, height - insets.top - insets.bottom - 24);
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={`Notificações${unread ? `, ${unread} não lidas` : ""}`} onPress={() => setVisible(true)} style={[styles.bell, { backgroundColor: theme.colors.surfaceVariant }]}>
      <Bell size={19} color={theme.colors.text} />
      {unread ? <View style={[styles.count, { backgroundColor: theme.colors.error }]}><Text style={styles.countText}>{unread > 99 ? "99+" : unread}</Text></View> : null}
    </Pressable>
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
      <View style={[styles.overlay, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
        <Pressable accessibilityLabel="Fechar notificações" style={StyleSheet.absoluteFill} onPress={() => setVisible(false)} />
        <View accessibilityViewIsModal style={[styles.panel, { width: panelWidth, maxHeight: panelHeight, backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.top}><Text style={[styles.title, { color: theme.colors.text }]}>Notificações</Text><Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={() => setVisible(false)}><X color={theme.colors.text} /></Pressable></View>
          <Pressable accessibilityRole="button" onPress={() => void activate()}><Text style={{ color: theme.colors.primary, fontWeight: "800" }}>Ativar notificações neste dispositivo</Text></Pressable>
          {error ? <Text accessibilityRole="alert" style={{ color: theme.colors.error }}>{error}</Text> : null}
          <Pressable accessibilityRole="button" onPress={markAllRead}><Text style={{ color: theme.colors.primary }}>Marcar todas como lidas</Text></Pressable>
          <ScrollView style={styles.noticeScroll} contentContainerStyle={styles.noticeContent}>{notices.length ? notices.map(item => <Pressable key={item.id} onPress={() => { open(item); setVisible(false); }} style={[styles.item, { borderColor: theme.colors.border, opacity: item.read ? .65 : 1 }]}><Text style={{ color: theme.colors.text, fontWeight: "800" }}>{item.title}</Text><Text style={{ color: theme.colors.textSecondary }}>{item.body}</Text></Pressable>) : <Text style={{ color: theme.colors.textSecondary }}>Nenhum aviso recebido neste dispositivo.</Text>}</ScrollView>
        </View>
      </View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  bell: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  count: { position: "absolute", right: -5, top: -5, minWidth: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 }, countText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  overlay: { flex: 1, alignItems: "flex-end", paddingHorizontal: 12 }, panel: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 12, elevation: 8, flexShrink: 1 }, top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, title: { fontSize: 18, fontWeight: "900" }, noticeScroll: { flexShrink: 1 }, noticeContent: { paddingBottom: 2 }, item: { borderTopWidth: 1, paddingVertical: 12, gap: 3 },
});
