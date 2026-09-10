import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BookOpenCheck, ShieldCheck, Sparkles } from "lucide-react-native";
import { authErrorMessage } from "../../services/authErrors";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Loading } from "../../components/ui/Loading";
import { Card } from "../../components/ui/Card";

export default function LoginScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 860;
  const { handleLogin, isLoading, sessionError } = useAuth();
  const { registered } = useLocalSearchParams<{ registered?: string }>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { theme } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [keepConnected, setKeepConnected] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!username.trim()) newErrors.username = "Nome de usuário é obrigatório";
    if (!password) newErrors.password = "Senha é obrigatória";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginPress = async () => {
    setSubmitError(null);
    if (!validateForm()) return;
    try {
      await handleLogin(username, password, keepConnected);
    } catch (error) {
      setSubmitError(authErrorMessage(error));
    }
  };

  if (isLoading) return <Loading message="Carregando..." fullScreen />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View pointerEvents="none" style={[styles.blobOne, { backgroundColor: theme.dark ? "rgba(124,58,237,0.16)" : "rgba(124,58,237,0.10)" }]} />
      <View pointerEvents="none" style={[styles.blobTwo, { backgroundColor: theme.dark ? "rgba(59,130,246,0.11)" : "rgba(59,130,246,0.08)" }]} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboardAvoid}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={[styles.layout, wide && styles.layoutWide]}>
            <View style={[styles.brandPanel, wide && styles.brandPanelWide]}>
              <Image source={require("../../../assets/images/logo-aprovia.png")} resizeMode="contain" style={styles.logo} accessibilityLabel="AprovIA" />
              <View style={[styles.brandBadge, { backgroundColor: theme.dark ? "rgba(167,139,250,0.14)" : "#F3E8FF" }]}> 
                <Sparkles size={15} color={theme.colors.primary} />
                <Text style={[styles.brandBadgeText, { color: theme.colors.primary }]}>Seu tutor de estudos com IA</Text>
              </View>
              <Text style={[styles.heroTitle, { color: theme.colors.text }]}>Estude com mais foco, clareza e confiança.</Text>
              <Text style={[styles.heroText, { color: theme.colors.textSecondary }]}>Entre para continuar suas conversas e escolher o tutor ideal para cada matéria.</Text>
              {wide ? (
                <View style={styles.benefits}>
                  <Benefit icon={<BookOpenCheck size={18} color={theme.colors.primary} />} text="Explicações objetivas para seus estudos" color={theme.colors.text} />
                  <Benefit icon={<ShieldCheck size={18} color={theme.colors.primary} />} text="Sua sessão continua protegida" color={theme.colors.text} />
                </View>
              ) : null}
            </View>

            <Card variant="elevated" style={[styles.card, wide && styles.cardWide]}>
              <View style={styles.formHeader}>
                <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>BEM-VINDO DE VOLTA</Text>
                <Text style={[styles.title, { color: theme.colors.text }]}>Entrar no AprovIA</Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Use seu usuário e senha para continuar.</Text>
              </View>

              {registered === "1" ? (
                <View style={[styles.notice, { backgroundColor: theme.dark ? "rgba(16,185,129,0.12)" : "#ECFDF3" }]}> 
                  <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.success, fontWeight: "700" }}>Conta criada com sucesso. Agora é só entrar.</Text>
                </View>
              ) : null}
              {submitError || sessionError ? (
                <View style={[styles.notice, { backgroundColor: theme.dark ? "rgba(239,68,68,0.12)" : "#FEF2F2" }]}> 
                  <Text accessibilityRole="alert" style={{ color: theme.colors.error, fontWeight: "700" }}>{submitError || sessionError}</Text>
                </View>
              ) : null}

              <Input label="Nome de usuário" placeholder="seu_usuario" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} editable={!isLoading} error={errors.username} />
              <Input label="Senha" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry editable={!isLoading} error={errors.password} />

              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel="Manter conectado"
                accessibilityState={{ checked: keepConnected }}
                disabled={isLoading}
                onPress={() => setKeepConnected(!keepConnected)}
                style={styles.keepConnectedContainer}
              >
                <View style={[styles.checkbox, { backgroundColor: keepConnected ? theme.colors.primary : theme.colors.surface, borderColor: keepConnected ? theme.colors.primary : theme.colors.border }]}>
                  {keepConnected ? <Text style={styles.check}>✓</Text> : null}
                </View>
                <Text style={[styles.keepConnectedLabel, { color: theme.colors.text }]}>Manter conectado</Text>
              </Pressable>

              <Button title="Entrar" onPress={handleLoginPress} disabled={isLoading || !username || !password} loading={isLoading} style={styles.button} />

              <View style={[styles.footerDivider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.signupContainer}>
                <Text style={[styles.signupText, { color: theme.colors.textSecondary }]}>Ainda não tem uma conta?</Text>
                <Pressable accessibilityRole="link" onPress={() => router.push("/register")} hitSlop={8}>
                  <Text style={[styles.signupLink, { color: theme.colors.primary }]}>Cadastre-se</Text>
                </Pressable>
              </View>
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Benefit({ icon, text, color }: { icon: React.ReactNode; text: string; color: string }) {
  return <View style={styles.benefitRow}>{icon}<Text style={[styles.benefitText, { color }]}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: "hidden" },
  keyboardAvoid: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 20, paddingVertical: 34 },
  layout: { width: "100%", maxWidth: 1040, alignSelf: "center", gap: 30 },
  layoutWide: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 64 },
  brandPanel: { alignItems: "center", maxWidth: 560, alignSelf: "center" },
  brandPanelWide: { flex: 1, alignItems: "flex-start", alignSelf: "auto" },
  logo: { width: 178, height: 60, marginBottom: 20 },
  brandBadge: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, marginBottom: 18 },
  brandBadgeText: { fontSize: 12, fontWeight: "800" },
  heroTitle: { fontSize: 36, lineHeight: 43, fontWeight: "900", letterSpacing: -0.9, textAlign: "center", maxWidth: 560 },
  heroText: { fontSize: 16, lineHeight: 24, marginTop: 14, textAlign: "center", maxWidth: 520 },
  benefits: { marginTop: 28, gap: 12 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  benefitText: { fontSize: 14, fontWeight: "650" as any },
  card: { width: "100%", maxWidth: 470, alignSelf: "center", padding: 24 },
  cardWide: { flex: 0.88, padding: 30 },
  formHeader: { marginBottom: 24 },
  eyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 1.1, marginBottom: 7 },
  title: { fontSize: 29, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 7 },
  notice: { borderRadius: 14, padding: 12, marginBottom: 16 },
  keepConnectedContainer: { minHeight: 44, flexDirection: "row", alignItems: "center", alignSelf: "flex-start", marginBottom: 13 },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, justifyContent: "center", alignItems: "center", marginRight: 9 },
  check: { color: "#FFFFFF", fontWeight: "900", fontSize: 13 },
  keepConnectedLabel: { fontSize: 14, fontWeight: "650" as any },
  button: { marginTop: 4 },
  footerDivider: { height: 1, marginVertical: 22 },
  signupContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 5 },
  signupText: { fontSize: 14 },
  signupLink: { fontSize: 14, fontWeight: "800" },
  blobOne: { position: "absolute", width: 380, height: 380, borderRadius: 190, top: -170, right: -120 },
  blobTwo: { position: "absolute", width: 300, height: 300, borderRadius: 150, bottom: -140, left: -100 },
});
