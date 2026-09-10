import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronDown, ChevronUp, CircleHelp, Home } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { Card } from "@/components/ui/Card";

const FAQ = [
  { question: "Como faço login?", answer: "Use seu nome de usuário e senha cadastrados. Se esquecer a senha, contate o suporte." },
  { question: "Como cadastrar?", answer: "Clique em \"Cadastre-se\" na tela de login e preencha todos os campos obrigatórios." },
  { question: "Como editar meu perfil?", answer: "Abra o menu lateral e selecione \"Perfil\". A atualização exige a confirmação da senha, como no AprovIA Web." },
  { question: "Como excluir minha conta?", answer: "Acesse \"Perfil\" e use a seção \"Excluir conta\". O aplicativo pedirá confirmação antes de enviar a exclusão ao backend." },
  { question: "Problemas de acesso?", answer: "Verifique usuário e senha e confirme se o backend configurado no arquivo .env está acessível pela plataforma em uso." },
  { question: "Como usar voz no chat?", answer: "Toque no microfone para ditar. O texto reconhecido é colocado no campo e não é enviado automaticamente. Nas respostas, o botão de alto-falante inicia a leitura em voz alta." },
];

export default function HelpScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={styles.page}>
      <View style={styles.header}><View style={[styles.iconBox, { backgroundColor: theme.colors.surfaceVariant }]}><CircleHelp size={28} color={theme.colors.info} /></View><View style={{ flex: 1 }}><Text style={[styles.title, { color: theme.colors.text }]}>Ajuda & FAQ</Text><Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Conteúdo adaptado da tela de ajuda do AprovIA Web.</Text></View></View>
      <Card variant="elevated" style={styles.card}>
        {FAQ.map((item, index) => {
          const open = openIndex === index;
          return <View key={item.question} style={[styles.item, index < FAQ.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpenIndex(open ? null : index)} style={({ pressed }) => [styles.question, { backgroundColor: pressed ? theme.colors.surfaceVariant : "transparent" }]}>
              <View style={[styles.dot, { backgroundColor: [theme.colors.info, theme.colors.success, theme.colors.warning, theme.colors.error, theme.colors.primary, theme.colors.secondary][index] }]} />
              <Text style={[styles.questionText, { color: theme.colors.text }]}>{item.question}</Text>
              {open ? <ChevronUp size={18} color={theme.colors.info} /> : <ChevronDown size={18} color={theme.colors.textSecondary} />}
            </Pressable>
            {open ? <Text selectable style={[styles.answer, { color: theme.colors.textSecondary }]}>{item.answer}</Text> : null}
          </View>;
        })}
      </Card>
      <Pressable accessibilityRole="button" accessibilityLabel="Voltar para o chat" onPress={() => router.replace("/chat" as any)} style={({ pressed }) => [styles.homeButton, { backgroundColor: theme.colors.primary, opacity: pressed ? 0.82 : 1 }]}><Home size={18} color="#fff" /><Text style={styles.homeText}>Voltar para o início</Text></Pressable>
      <Text style={[styles.version, { color: theme.colors.textSecondary }]}>AprovIA v1.0.0</Text>
    </ScrollView>
  );
}
const styles = StyleSheet.create({ page: { width: "100%", maxWidth: 760, alignSelf: "center", padding: 24, paddingBottom: 40 }, header: { flexDirection: "row", gap: 14, alignItems: "center", marginBottom: 20 }, iconBox: { width: 58, height: 58, borderRadius: 20, alignItems: "center", justifyContent: "center" }, title: { fontSize: 30, fontWeight: "900", letterSpacing: -0.6 }, subtitle: { fontSize: 14, lineHeight: 20, marginTop: 3 }, card: { padding: 8 }, item: { overflow: "hidden" }, question: { flexDirection: "row", alignItems: "center", minHeight: 58, paddingHorizontal: 12, borderRadius: 14, gap: 10 }, dot: { width: 10, height: 10, borderRadius: 5 }, questionText: { flex: 1, fontSize: 15, fontWeight: "750" as any }, answer: { paddingHorizontal: 32, paddingBottom: 18, fontSize: 14, lineHeight: 21 }, homeButton: { marginTop: 22, minHeight: 50, alignSelf: "center", paddingHorizontal: 20, borderRadius: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, homeText: { color: "#fff", fontWeight: "800" }, version: { marginTop: 18, textAlign: "center", fontSize: 12 } });
