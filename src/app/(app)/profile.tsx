import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ShieldCheck, Trash2, UserRound } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { AuthService } from "@/services/AuthService";
import { authErrorMessage } from "@/services/authErrors";
import { ValidationService } from "@/utils/ValidationService";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { User } from "@/models/User";

export default function ProfileScreen() {
  const { user, handleUpdateUser, handleDeleteUser, isLoading } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProfile = async () => {
    if (!user) return;
    setLoadingProfile(true); setLoadError(null);
    try { setProfile(await AuthService.getUser(user.id)); }
    catch (error) { setLoadError(authErrorMessage(error)); }
    finally { setLoadingProfile(false); }
  };
  useEffect(() => { void loadProfile(); }, [user?.id]);

  const update = (key: keyof User, value: string) => setProfile((current) => current ? { ...current, [key]: value } : current);
  const submit = async () => {
    if (!profile) return;
    setFormError(null); setSuccess(null);
    if (!profile.name.trim() || !profile.lastname.trim() || !profile.username.trim() || !profile.email.trim()) { setFormError("Preencha nome, sobrenome, usuário e e-mail."); return; }
    if (!ValidationService.isValidUsername(profile.username)) { setFormError("Nome de usuário inválido."); return; }
    if (!ValidationService.isValidEmail(profile.email)) { setFormError("Digite um e-mail válido."); return; }
    const passwordError = ValidationService.getPasswordError(password);
    if (passwordError) { setFormError(passwordError); return; }
    if (password !== confirmPassword) { setFormError("As senhas não coincidem."); return; }
    try {
      await handleUpdateUser({
        username: profile.username.trim(), name: profile.name.trim(), lastname: profile.lastname.trim(), email: profile.email.trim(),
        birthday: profile.birthday, picture: profile.picture ?? "", password,
      });
      setPassword(""); setConfirmPassword(""); setSuccess("Perfil atualizado com sucesso.");
      await loadProfile();
    } catch (error) { setFormError(authErrorMessage(error)); }
  };

  const confirmDelete = () => {
    const execute = async () => {
      setDeleting(true); setFormError(null);
      try { await handleDeleteUser(); router.replace("/login" as any); }
      catch (error) { setFormError(authErrorMessage(error)); }
      finally { setDeleting(false); }
    };
    if (Platform.OS === "web") {
      if (globalThis.confirm?.("Tem certeza? Esta ação exclui sua conta e não pode ser desfeita.")) void execute();
      return;
    }
    Alert.alert("Excluir conta", "Tem certeza? Esta ação não pode ser desfeita.", [
      { text: "Cancelar", style: "cancel" }, { text: "Excluir", style: "destructive", onPress: () => void execute() },
    ]);
  };

  if (loadingProfile) return <View style={[styles.center, { backgroundColor: theme.colors.background }]}><ActivityIndicator color={theme.colors.primary} /><Text style={{ color: theme.colors.textSecondary }}>Carregando perfil...</Text></View>;
  if (loadError || !profile) return <View style={[styles.center, { backgroundColor: theme.colors.background }]}><Text style={[styles.error, { color: theme.colors.error }]}>{loadError ?? "Perfil indisponível."}</Text><Button title="Tentar novamente" onPress={() => void loadProfile()} /></View>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.surfaceVariant }]}>
          {profile.picture ? <Image source={{ uri: profile.picture }} style={styles.avatarImage} /> : <UserRound size={34} color={theme.colors.primary} />}
        </View>
        <View style={{ flex: 1 }}><Text style={[styles.title, { color: theme.colors.text }]}>Seu perfil</Text><Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Atualize seus dados usando as mesmas regras do AprovIA Web.</Text></View>
      </View>

      <Card variant="elevated" style={styles.card}>
        <View style={styles.sectionTitleRow}><ShieldCheck size={18} color={theme.colors.primary} /><Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Dados pessoais</Text></View>
        <View style={styles.grid}>
          <Input label="Nome" value={profile.name} onChangeText={(v) => update("name", v)} style={styles.field} />
          <Input label="Sobrenome" value={profile.lastname} onChangeText={(v) => update("lastname", v)} style={styles.field} />
          <Input label="Nome de usuário" autoCapitalize="none" value={profile.username} onChangeText={(v) => update("username", v)} style={styles.field} />
          <Input label="E-mail" autoCapitalize="none" keyboardType="email-address" value={profile.email} onChangeText={(v) => update("email", v)} style={styles.field} />
          <Input label="URL da foto (opcional)" autoCapitalize="none" value={profile.picture ?? ""} onChangeText={(v) => update("picture", v)} style={styles.field} />
          <View style={styles.field}><Text style={[styles.readonlyLabel, { color: theme.colors.text }]}>Data de nascimento</Text><View style={[styles.readonly, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.border }]}><Text style={{ color: theme.colors.textSecondary }}>{profile.birthday}</Text></View></View>
          <Input label="Senha atual/nova senha" secureTextEntry value={password} onChangeText={setPassword} style={styles.field} />
          <Input label="Confirmar senha" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} style={styles.field} />
        </View>
        {formError ? <Text accessibilityRole="alert" style={[styles.feedback, { color: theme.colors.error }]}>{formError}</Text> : null}
        {success ? <Text accessibilityRole="alert" style={[styles.feedback, { color: theme.colors.success }]}>{success}</Text> : null}
        <Button title="Salvar alterações" loading={isLoading && !deleting} disabled={!password || !confirmPassword || deleting} onPress={() => void submit()} />
      </Card>

      <Card style={[styles.dangerCard, { borderColor: theme.dark ? "rgba(248,113,113,0.35)" : "#FECACA" }]}>
        <View style={styles.sectionTitleRow}><Trash2 size={18} color={theme.colors.error} /><Text style={[styles.sectionTitle, { color: theme.colors.error }]}>Excluir conta</Text></View>
        <Text style={[styles.dangerText, { color: theme.colors.textSecondary }]}>A exclusão só é aplicada depois da confirmação do backend. Se falhar, sua sessão permanece ativa.</Text>
        <Button title="Excluir minha conta" variant="danger" loading={deleting} disabled={isLoading && !deleting} onPress={confirmDelete} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { width: "100%", maxWidth: 940, alignSelf: "center", padding: 24, gap: 18 }, center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 2 }, avatar: { width: 64, height: 64, borderRadius: 22, alignItems: "center", justifyContent: "center", overflow: "hidden" }, avatarImage: { width: "100%", height: "100%" },
  title: { fontSize: 30, fontWeight: "900", letterSpacing: -0.6 }, subtitle: { fontSize: 14, lineHeight: 20, marginTop: 3 }, card: { padding: 22 }, sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 18 }, sectionTitle: { fontSize: 18, fontWeight: "850" as any },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14 }, field: { flexGrow: 1, flexBasis: 310, marginBottom: 0 }, readonlyLabel: { fontSize: 14, fontWeight: "700", marginBottom: 7 }, readonly: { minHeight: 54, borderWidth: 1, borderRadius: 16, paddingHorizontal: 15, justifyContent: "center" },
  feedback: { fontWeight: "700", marginVertical: 12 }, dangerCard: { marginBottom: 22 }, dangerText: { lineHeight: 21, marginBottom: 16 }, error: { textAlign: "center", fontWeight: "700" },
});
