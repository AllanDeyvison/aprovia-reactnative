import React from "react";
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "success";
  disabled?: boolean;
  loading?: boolean;
  size?: "small" | "medium" | "large";
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  size = "medium",
  style,
  textStyle,
}) => {
  const { theme } = useTheme();
  const backgroundColor = variant === "secondary" ? theme.colors.secondary : variant === "danger" ? theme.colors.error : variant === "success" ? theme.colors.success : theme.colors.primary;
  const padding = size === "small" ? { paddingVertical: 9, paddingHorizontal: 14 } : size === "large" ? { paddingVertical: 16, paddingHorizontal: 24 } : { paddingVertical: 14, paddingHorizontal: 18 };
  const fontSize = size === "small" ? 14 : size === "large" ? 18 : 16;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          opacity: disabled || loading ? 0.55 : pressed ? 0.86 : 1,
          transform: [{ scale: pressed && !disabled ? 0.99 : 1 }],
          ...padding,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={[styles.text, { fontSize }, textStyle]}>{title}</Text>}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },
  text: { color: "#FFFFFF", fontWeight: "800", letterSpacing: 0.15 },
});
