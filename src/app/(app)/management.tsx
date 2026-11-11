import React from "react";
import { Redirect, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ShieldCheck } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Loading } from "@/components/ui/Loading";
import { MaterialsPanel } from "@/components/materials/MaterialsPanel";
import { ExamsPanel } from "@/components/exams/ExamsPanel";

export default function ManagementScreen() {
  const { user, isAdmin, isRestoring } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  // This guard also covers direct web URLs and Android deep links. The sidebar is not an authorization boundary.
  if (isRestoring) return <Loading message="Validando sessão..." fullScreen />;
  if (!user) return <Redirect href="/login" />;
  if (!isAdmin) return <Redirect href="/chat" />;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={styles.page}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: theme.colors.surfaceVariant }]}><ShieldCheck size={29} color={theme.colors.primary} /></View>
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>Gerenciamento</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Área administrativa do AprovIA.</Text>
        </View>
      </View>
      <Card variant="elevated" style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Administrador autenticado</Text>
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{user.name || user.username} (@{user.username})</Text>
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>Os recursos de gerenciamento serão disponibilizados aqui conforme forem integrados ao servidor.</Text>
      </Card>
      <MaterialsPanel admin />
      <ExamsPanel key={user.id} />
      <Button title="Voltar para a área comum" onPress={() => router.replace("/chat" as any)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { width: "100%", maxWidth: 760, alignSelf: "center", padding: 24, paddingBottom: 40, gap: 18 },
  header: { flexDirection: "row", gap: 14, alignItems: "center" },
  iconBox: { width: 58, height: 58, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 30, fontWeight: "900", letterSpacing: -0.6 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 3 },
  card: { padding: 22, gap: 10 },
  cardTitle: { fontSize: 18, fontWeight: "850" as any },
  description: { fontSize: 14, lineHeight: 21 },
});
