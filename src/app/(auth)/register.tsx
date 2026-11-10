import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ImagePlus, Sparkles } from "lucide-react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Loading } from "../../components/ui/Loading";
import { Card } from "../../components/ui/Card";
import { DatePickerField } from "../../components/ui/DatePickerField";
import { ValidationService } from "../../utils/ValidationService";
import { authErrorMessage } from "../../services/authErrors";
import { ProfilePictureService, type ProfilePictureAsset } from "../../services/ProfilePictureService";
import { Avatar } from "../../components/ui/Avatar";

export default function RegisterScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const twoColumns = width >= 720;
  const { handleSignupAndLogin, completePendingSignupLogin, isLoading } = useAuth();
  const { theme } = useTheme();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", lastname: "", username: "", email: "", birthday: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [selectedPicture, setSelectedPicture] = useState<ProfilePictureAsset | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [pictureWarning, setPictureWarning] = useState<string | null>(null);
  useEffect(() => () => {
    const uri = selectedPicture?.uri;
    if (Platform.OS === "web" && uri?.startsWith("blob:") && typeof URL !== "undefined") URL.revokeObjectURL(uri);
  }, [selectedPicture?.uri]);

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
    setSubmitError(null); setPictureWarning(null);
    if (!validateForm()) {
      setSubmitError("Por favor, corrija os erros do formulário.");
      return;
    }
    try {
      if (selectedPicture) ProfilePictureService.validate(selectedPicture);
      const result = await handleSignupAndLogin({
        name: formData.name.trim(),
        lastname: formData.lastname.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        birthday: formData.birthday,
        password: formData.password,
      }, selectedPicture, setProgress);
      setProgress(null);
      if (result.pictureError) setPictureWarning(result.pictureError);
    } catch (error) {
      setProgress(null);
      setSubmitError(authErrorMessage(error));
    }
  };
  const selectPicture = async () => {
    setSubmitError(null);
    try {
      const asset = await ProfilePictureService.pick();
      if (asset) setSelectedPicture(asset);
    } catch (error) { setSubmitError(authErrorMessage(error)); }
  };
  const continueWithoutPicture = async () => {
    try { await completePendingSignupLogin(); }
    catch (error) { setSubmitError(authErrorMessage(error)); }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View pointerEvents="none" style={[styles.blobOne, { backgroundColor: theme.dark ? "rgba(124,58,237,0.15)" : "rgba(124,58,237,0.09)" }]} />
      <KeyboardAvoidingView enabled={Platform.OS === "ios"}  behavior="padding" style={styles.keyboardAvoid}>
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
            {progress ? <View accessibilityLiveRegion="polite" style={[styles.notice, { backgroundColor: theme.colors.surfaceVariant }]}><Text style={{ color: theme.colors.text, fontWeight: "700" }}>{progress}</Text></View> : null}
            {pictureWarning ? <View style={[styles.notice, { backgroundColor: theme.dark ? "rgba(245,158,11,0.14)" : "#FFFBEB" }]}><Text accessibilityRole="alert" style={{ color: theme.colors.warning, fontWeight: "700" }}>{pictureWarning}</Text><Button title="Continuar" onPress={() => void continueWithoutPicture()} style={styles.continueButton} /></View> : null}

            <View style={[styles.row, !twoColumns && styles.rowStack]}>
              <View style={styles.halfInput}><Input label="Nome" placeholder="João" value={formData.name} onChangeText={(text) => setFormData({ ...formData, name: text })} editable={!isLoading} error={errors.name} /></View>
              <View style={styles.halfInput}><Input label="Sobrenome" placeholder="Silva" value={formData.lastname} onChangeText={(text) => setFormData({ ...formData, lastname: text })} editable={!isLoading} error={errors.lastname} /></View>
            </View>

            <View style={[styles.row, !twoColumns && styles.rowStack]}>
              <View style={styles.halfInput}><Input label="Nome de usuário" placeholder="joao_silva" value={formData.username} autoCapitalize="none" autoCorrect={false} onChangeText={(text) => setFormData({ ...formData, username: text })} editable={!isLoading} error={errors.username} /></View>
              <View style={styles.halfInput}><DatePickerField label="Data de nascimento" value={formData.birthday} onChange={(birthday) => setFormData({ ...formData, birthday })} disabled={isLoading} error={errors.birthday} /></View>
            </View>

            <Input label="Email" placeholder="joao@example.com" value={formData.email} onChangeText={(text) => setFormData({ ...formData, email: text })} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!isLoading} error={errors.email} />

            <View style={[styles.photoSection, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceVariant }]}>
              {selectedPicture ? <Image source={{ uri: selectedPicture.uri }} style={styles.photoPreview} /> : <Avatar initials={(formData.name || formData.username || "?").slice(0, 2).toUpperCase()} size="large" />}
              <View style={styles.photoCopy}><View style={styles.photoTitleRow}><ImagePlus size={17} color={theme.colors.primary} /><Text style={[styles.photoTitle, { color: theme.colors.text }]}>Foto de perfil — opcional</Text></View><Text style={[styles.photoHint, { color: theme.colors.textSecondary }]}>PNG, JPEG ou WebP de até 5 MB.</Text></View>
              <View style={styles.photoButtons}><Button title="Escolher foto" size="small" variant="secondary" disabled={isLoading || !!pictureWarning} onPress={() => void selectPicture()} />{selectedPicture ? <Button title="Remover seleção" size="small" variant="secondary" disabled={isLoading || !!pictureWarning} onPress={() => setSelectedPicture(null)} /> : null}</View>
            </View>

            <View style={[styles.row, !twoColumns && styles.rowStack]}>
              <View style={styles.halfInput}><Input label="Senha" placeholder="••••••••" value={formData.password} onChangeText={(text) => setFormData({ ...formData, password: text })} secureTextEntry editable={!isLoading} error={errors.password} /></View>
              <View style={styles.halfInput}><Input label="Confirmar senha" placeholder="••••••••" value={formData.confirmPassword} onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })} secureTextEntry editable={!isLoading} error={errors.confirmPassword} /></View>
            </View>
            <Text style={[styles.passwordHint, { color: theme.colors.textSecondary }]}>Use pelo menos 8 caracteres, incluindo letras e números.</Text>

            <Button title="Criar conta" onPress={handleRegisterPress} disabled={isLoading || !!pictureWarning} loading={isLoading} style={styles.button} />
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
  continueButton: { marginTop: 12 },
  row: { flexDirection: "row", gap: 14 },
  rowStack: { flexDirection: "column", gap: 0 },
  halfInput: { flex: 1, minWidth: 0 },
  passwordHint: { fontSize: 12, lineHeight: 18, marginTop: -3, marginBottom: 14 },
  photoSection: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 14, flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 11 },
  photoPreview: { width: 64, height: 64, borderRadius: 32 },
  photoCopy: { flex: 1, minWidth: 170 }, photoTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 }, photoTitle: { fontSize: 14, fontWeight: "800" }, photoHint: { fontSize: 12, lineHeight: 17, marginTop: 4 }, photoButtons: { flexDirection: "row", flexWrap: "wrap", gap: 8, width: "100%" },
  button: { marginTop: 5 },
  footerDivider: { height: 1, marginVertical: 22 },
  loginContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 5 },
  loginText: { fontSize: 14 },
  loginLink: { fontSize: 14, fontWeight: "800" },
  blobOne: { position: "absolute", width: 420, height: 420, borderRadius: 210, top: -190, right: -150 },
});
