import React from "react";
import { Image, View, Text, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

interface AvatarProps {
  uri?: string;
  initials?: string;
  size?: "small" | "medium" | "large";
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  initials,
  size = "medium",
  style,
}) => {
  const { theme } = useTheme();

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return { width: 32, height: 32, fontSize: 12 };
      case "large":
        return { width: 64, height: 64, fontSize: 18 };
      default:
        return { width: 48, height: 48, fontSize: 16 };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.avatar,
        {
          width: sizeStyles.width,
          height: sizeStyles.height,
          borderRadius: sizeStyles.width / 2,
          backgroundColor: theme.colors.primary,
        },
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{
            width: sizeStyles.width,
            height: sizeStyles.height,
            borderRadius: sizeStyles.width / 2,
          }}
        />
      ) : (
        <Text
          style={{
            fontSize: sizeStyles.fontSize,
            fontWeight: "600",
            color: "#FFFFFF",
            textAlign: "center",
            textAlignVertical: "center",
            flex: 1,
          }}
        >
          {initials || "?"}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    justifyContent: "center",
    alignItems: "center",
  },
});
