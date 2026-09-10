import React from "react";
import { View, ActivityIndicator, Text, StyleSheet, Modal } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

interface LoadingProps {
  visible?: boolean;
  message?: string;
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  visible = true,
  message,
  fullScreen = false,
}) => {
  const { theme } = useTheme();

  if (fullScreen && visible) {
    return (
      <Modal
        transparent
        animationType="fade"
        visible={visible}
        statusBarTranslucent
      >
        <View
          style={[
            styles.fullScreenContainer,
            {
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            },
          ]}
        >
          <View
            style={[
              styles.loadingBox,
              {
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <ActivityIndicator
              size="large"
              color={theme.colors.primary}
              style={styles.spinner}
            />
            {message && (
              <Text
                style={[
                  styles.message,
                  {
                    color: theme.colors.text,
                  },
                ]}
              >
                {message}
              </Text>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  if (!visible) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <ActivityIndicator size="large" color={theme.colors.primary} />
      {message && (
        <Text
          style={[
            styles.message,
            {
              color: theme.colors.text,
            },
          ]}
        >
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  fullScreenContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingBox: {
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    minWidth: 200,
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
});
