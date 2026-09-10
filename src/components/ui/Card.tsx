import React from "react";
import { View, ViewStyle, StyleSheet, StyleProp } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: "default" | "elevated" | "filled";
}

export const Card: React.FC<CardProps> = ({ children, style, variant = "default" }) => {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: variant === "filled" ? theme.colors.surfaceVariant : theme.colors.surface,
          borderColor: theme.colors.border,
          shadowColor: theme.dark ? "#000" : "#334155",
        },
        variant === "elevated" && styles.elevated,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 24, padding: 20, borderWidth: 1 },
  elevated: { shadowOpacity: 0.1, shadowRadius: 28, shadowOffset: { width: 0, height: 14 }, elevation: 5 },
});
