import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

interface SeparatorProps {
  vertical?: boolean;
  style?: ViewStyle;
}

export const Separator: React.FC<SeparatorProps> = ({ vertical = false, style }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        vertical ? styles.verticalSeparator : styles.horizontalSeparator,
        {
          backgroundColor: theme.colors.border,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  horizontalSeparator: {
    height: 1,
    width: "100%",
  },
  verticalSeparator: {
    width: 1,
    height: "100%",
  },
});
