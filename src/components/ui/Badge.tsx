import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

interface BadgeProps {
  label: string;
  variant?: "primary" | "secondary" | "success" | "error" | "warning";
  size?: "small" | "medium";
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = "primary",
  size = "medium",
  style,
}) => {
  const { theme } = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case "secondary":
        return theme.colors.secondary;
      case "success":
        return theme.colors.success;
      case "error":
        return theme.colors.error;
      case "warning":
        return theme.colors.warning;
      default:
        return theme.colors.primary;
    }
  };

  const getPaddingSize = () => {
    return size === "small"
      ? { paddingVertical: 4, paddingHorizontal: 8 }
      : { paddingVertical: 6, paddingHorizontal: 12 };
  };

  const getFontSize = () => {
    return size === "small" ? 12 : 14;
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getBackgroundColor(),
          ...getPaddingSize(),
        },
        style,
      ]}
    >
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: getFontSize(),
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
