import React, { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import * as Speech from "expo-speech";
import { Pause, Play, Square, Volume2 } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";

export function TtsControls({ text, language, disabled = false }: { text: string; language: string; disabled?: boolean }) {
  const { theme } = useTheme();
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => () => { void Speech.stop(); }, []);

  const speak = async () => {
    if (!text.trim() || disabled) return;
    await Speech.stop();
    setPaused(false);
    setSpeaking(true);
    Speech.speak(text, {
      language,
      rate: 0.95,
      onDone: () => { setSpeaking(false); setPaused(false); },
      onStopped: () => { setSpeaking(false); setPaused(false); },
      onError: () => { setSpeaking(false); setPaused(false); },
    });
  };
  const pause = async () => {
    if (Platform.OS === "android") {
      await Speech.stop();
      setSpeaking(false);
      setPaused(false);
      return;
    }
    await Speech.pause();
    setPaused(true);
  };
  const resume = async () => { await Speech.resume(); setPaused(false); };
  const stop = async () => { await Speech.stop(); setSpeaking(false); setPaused(false); };

  return (
    <View style={styles.row}>
      {!speaking ? <IconButton label="Ouvir resposta" onPress={speak} disabled={disabled} icon={<Volume2 size={17} color={theme.colors.textSecondary} />} /> : null}
      {speaking && !paused ? <IconButton label={Platform.OS === "android" ? "Parar leitura" : "Pausar leitura"} onPress={pause} icon={<Pause size={17} color={theme.colors.textSecondary} />} /> : null}
      {speaking && paused ? <IconButton label="Continuar leitura" onPress={resume} icon={<Play size={17} color={theme.colors.textSecondary} />} /> : null}
      {speaking ? <IconButton label="Parar leitura" onPress={stop} icon={<Square size={16} color={theme.colors.textSecondary} />} /> : null}
    </View>
  );
}

function IconButton({ label, onPress, icon, disabled = false }: { label: string; onPress: () => void; icon: React.ReactNode; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, { opacity: disabled ? 0.35 : pressed ? 0.6 : 1 }]}>{icon}</Pressable>;
}

const styles = StyleSheet.create({ row: { flexDirection: "row", gap: 4, marginTop: 6 }, button: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 10 } });
