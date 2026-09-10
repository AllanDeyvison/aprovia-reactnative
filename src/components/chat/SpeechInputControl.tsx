import React, { useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Mic, MicOff } from "lucide-react-native";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { useTheme } from "@/contexts/ThemeContext";

type WebRecognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: any) => void) | null;
};

export function SpeechInputControl({ onTranscript, language, disabled = false }: { onTranscript: (text: string) => void; language: string; disabled?: boolean }) {
  const { theme } = useTheme();
  const [listening, setListening] = useState(false);
  const webRecognition = useRef<WebRecognition | null>(null);

  useSpeechRecognitionEvent("start", () => { if (Platform.OS !== "web") setListening(true); });
  useSpeechRecognitionEvent("end", () => { if (Platform.OS !== "web") setListening(false); });
  useSpeechRecognitionEvent("error", () => { if (Platform.OS !== "web") setListening(false); });
  useSpeechRecognitionEvent("result", (event) => {
    if (Platform.OS === "web") return;
    const value = event.results?.[0]?.transcript?.trim();
    if (event.isFinal && value) onTranscript(value);
  });

  useEffect(() => () => {
    if (Platform.OS === "web") {
      try { webRecognition.current?.stop(); } catch {}
      webRecognition.current = null;
    } else {
      try { ExpoSpeechRecognitionModule.stop(); } catch {}
    }
  }, []);

  const startWeb = () => {
    if (listening) { webRecognition.current?.stop(); return; }
    const scope = globalThis as any;
    const Recognition = scope.SpeechRecognition || scope.webkitSpeechRecognition;
    if (!Recognition) { scope.alert?.("Reconhecimento de voz não suportado neste navegador."); return; }
    const instance: WebRecognition = new Recognition();
    instance.lang = language;
    instance.interimResults = false;
    instance.maxAlternatives = 1;
    instance.onstart = () => setListening(true);
    instance.onresult = (event: any) => {
      const value = Array.from(event.results ?? []).map((result: any) => result?.[0]?.transcript ?? "").join(" ").trim();
      if (value) onTranscript(value);
    };
    instance.onerror = () => setListening(false);
    instance.onend = () => { setListening(false); webRecognition.current = null; };
    webRecognition.current = instance;
    try { instance.start(); } catch { setListening(false); webRecognition.current = null; }
  };

  const startNative = async () => {
    if (listening) { ExpoSpeechRecognitionModule.stop(); return; }
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) return;
    ExpoSpeechRecognitionModule.start({ lang: language, interimResults: true, maxAlternatives: 1, continuous: false });
  };

  const toggle = () => {
    if (disabled) return;
    if (Platform.OS === "web") startWeb();
    else void startNative();
  };

  return <Pressable accessibilityRole="button" accessibilityLabel={listening ? "Parar reconhecimento de voz" : "Iniciar reconhecimento de voz"} disabled={disabled} onPress={toggle} style={({ pressed }) => [styles.button, { backgroundColor: listening ? "rgba(239,68,68,0.12)" : theme.colors.surfaceVariant, opacity: disabled ? 0.35 : pressed ? 0.75 : 1 }]}>
    {listening ? <MicOff size={19} color={theme.colors.error} /> : <Mic size={19} color={theme.colors.textSecondary} />}
    {listening ? <View style={[styles.dot, { backgroundColor: theme.colors.error }]} /> : null}
  </Pressable>;
}
const styles = StyleSheet.create({ button: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", position: "relative" }, dot: { width: 7, height: 7, borderRadius: 4, position: "absolute", right: 5, top: 5 } });
