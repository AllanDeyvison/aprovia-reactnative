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
import { useRouter } from "expo-router";
import { Sparkles } from "lucide-react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Loading } from "../../components/ui/Loading";
import { Card } from "../../components/ui/Card";
import { DatePickerField } from "../../components/ui/DatePickerField";
import { ValidationService } from "../../utils/ValidationService";
import { authErrorMessage } from "../../services/authErrors";

export default function RegisterScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const twoColumns = width >= 720;
  const { handleSignup, isLoading } = useAuth();
  const { theme } = useTheme();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", lastname: "", username: "", email: "", birthday: "", password: "", confirmPassword: "", picture: "" });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors = ValidationService.validateSignup(formData);
    const errorObj: { [key: string]: string } = {};
    newErrors.forEach((error) => {
      if (error.includes("Nome de usuário")) errorObj.username = error;
      else if (error.includes("Nome")) errorObj.name = error;
      else if (error.includes("Sobrenome")) errorObj.lastname = error;
      else if (error.includes("Email")) errorObj.email = error;
      else if (error.includes("Data") || error.includes("18")) errorObj.birthday = error;
      else if (error.includes("coincidem")) errorObj.confirmPassword = error;
      else if (error.includes("Senha")) errorObj.password = error;
    });
    setErrors(errorObj);
    return newErrors.length === 0;
  };

  const handleRegisterPress = async () => {
    setSubmitError(null);
    if (!validateForm()) {
      setSubmitError("Por favor, corrija os erros do formulário.");
      return;
    }
    try {
      await handleSignup({
        name: formData.name.trim(),
        lastname: formData.lastname.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        birthday: formData.birthday,
        password: formData.password,
        picture: formData.picture || undefined,
      });
      router.replace({ pathname: "/login", params: { registered: "1" } });
    } catch (error) {
      setSubmitError(authErrorMessage(error));
    }
  };

  if (isLoading) return <Loading message="Criando conta..." fullScreen />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View pointerEvents="none" style={[styles.blobOne, { backgroundColor: theme.dark ? "rgba(124,58,237,0.15)" : "rgba(124,58,237,0.09)" }]} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboardAvoid}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator
        >
          <View style={styles.pageHeader}>
            <Image source={require("../../../assets/images/logo-aprovia.png")} resizeMode="contain" style={styles.logo} accessibilityLabel="AprovIA" />
            <View style={[styles.brandBadge, { backgroundColor: theme.dark ? "rgba(167,139,250,0.14)" : "#F3E8FF" }]}>
              <Sparkles size={14} color={theme.colors.primary} />
              <Text style={[styles.brandBadgeText, { color: theme.colors.primary }]}>Comece sua jornada de estudos</Text>
            </View>
          </View>

          <Card variant="elevated" style={styles.card}>
            <View style={styles.formHeader}>
              <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>CRIAR CONTA</Text>
              <Text style={[styles.title, { color: theme.colors.text }]}>Seu espaço no AprovIA</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Preencha seus dados para personalizar sua experiência.</Text>
            </View>

            {submitError ? (
              <View style={[styles.notice, { backgroundColor: theme.dark ? "rgba(239,68,68,0.12)" : "#FEF2F2" }]}> 
                <Text accessibilityRole="alert" style={{ color: theme.colors.error, fontWeight: "700" }}>{submitError}</Text>
              </View>
            ) : null}

            <View style={[styles.row, !twoColumns && styles.rowStack]}>
              <View style={styles.halfInput}><Input label="Nome" placeholder="João" value={formData.name} onChangeText={(text) => setFormData({ ...formData, name: text })} editable={!isLoading} error={errors.name} /></View>
              <View style={styles.halfInput}><Input label="Sobrenome" placeholder="Silva" value={formData.lastname} onChangeText={(text) => setFormData({ ...formData, lastname: text })} editable={!isLoading} error={errors.lastname} /></View>
            </View>

            <View style={[styles.row, !twoColumns && styles.rowStack]}>
              <View style={styles.halfInput}><Input label="Nome de usuário" placeholder="joao_silva" value={formData.username} autoCapitalize="none" autoCorrect={false} onChangeText={(text) => setFormData({ ...formData, username: text })} editable={!isLoading} error={errors.username} /></View>
              <View style={styles.halfInput}><DatePickerField label="Data de nascimento" value={formData.birthday} onChange={(birthday) => setFormData({ ...formData, birthday })} disabled={isLoading} error={errors.birthday} /></View>
            </View>

            <Input label="Email" placeholder="joao@example.com" value={formData.email} onChangeText={(text) => setFormData({ ...formData, email: text })} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!isLoading} error={errors.email} />
            <Input label="Foto (URL) — opcional" placeholder="https://example.com/foto.jpg" value={formData.picture} onChangeText={(text) => setFormData({ ...formData, picture: text })} editable={!isLoading} />

            <View style={[styles.row, !twoColumns && styles.rowStack]}>
              <View style={styles.halfInput}><Input label="Senha" placeholder="••••••••" value={formData.password} onChangeText={(text) => setFormData({ ...formData, password: text })} secureTextEntry editable={!isLoading} error={errors.password} /></View>
              <View style={styles.halfInput}><Input label="Confirmar senha" placeholder="••••••••" value={formData.confirmPassword} onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })} secureTextEntry editable={!isLoading} error={errors.confirmPassword} /></View>
            </View>
            <Text style={[styles.passwordHint, { color: theme.colors.textSecondary }]}>Use pelo menos 8 caracteres, incluindo letras e números.</Text>

            <Button title="Criar conta" onPress={handleRegisterPress} disabled={isLoading} loading={isLoading} style={styles.button} />
            <View style={[styles.footerDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: theme.colors.textSecondary }]}>Já tem uma conta?</Text>
              <Pressable accessibilityRole="link" onPress={() => router.push("/login")} hitSlop={8}>
                <Text style={[styles.loginLink, { color: theme.colors.primary }]}>Faça login</Text>
              </Pressable>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: "hidden" },
  keyboardAvoid: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 30, paddingBottom: 56 },
  pageHeader: { width: "100%", maxWidth: 850, alignSelf: "center", alignItems: "center", marginBottom: 20 },
  logo: { width: 160, height: 54, marginBottom: 10 },
  brandBadge: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999 },
  brandBadgeText: { fontSize: 12, fontWeight: "800" },
  card: { width: "100%", maxWidth: 850, alignSelf: "center", padding: 26 },
  formHeader: { marginBottom: 24 },
  eyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 1.1, marginBottom: 7 },
  title: { fontSize: 29, fontWeight: "900", letterSpacing: -0.55 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 7 },
  notice: { borderRadius: 14, padding: 12, marginBottom: 16 },
  row: { flexDirection: "row", gap: 14 },
  rowStack: { flexDirection: "column", gap: 0 },
  halfInput: { flex: 1, minWidth: 0 },
  passwordHint: { fontSize: 12, lineHeight: 18, marginTop: -3, marginBottom: 14 },
  button: { marginTop: 5 },
  footerDivider: { height: 1, marginVertical: 22 },
  loginContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 5 },
  loginText: { fontSize: 14 },
  loginLink: { fontSize: 14, fontWeight: "800" },
  blobOne: { position: "absolute", width: 420, height: 420, borderRadius: 210, top: -190, right: -150 },
});
