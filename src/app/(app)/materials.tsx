import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Library } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { MaterialsPanel } from "@/components/materials/MaterialsPanel";
export default function MaterialsScreen() { const { theme } = useTheme(); return <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={styles.page}><View style={styles.header}><Library size={30} color={theme.colors.primary} /><View><Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>Materiais</Text><Text style={{ color: theme.colors.textSecondary }}>Arquivos disponíveis para estudo.</Text></View></View><MaterialsPanel /></ScrollView>; }
const styles = StyleSheet.create({ page: { width: "100%", maxWidth: 900, alignSelf: "center", padding: 24, gap: 20 }, header: { flexDirection: "row", alignItems: "center", gap: 12 }, title: { fontSize: 30, fontWeight: "900" } });
