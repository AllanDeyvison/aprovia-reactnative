import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";

type ThemePreference = "light" | "dark" | "system";

export interface Theme {
  dark: boolean;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    surfaceVariant: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    error: string;
    warning: string;
    info: string;
    transparent: string;
  };
}

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const lightTheme: Theme = {
  dark: false,
  colors: {
    primary: "#7C3AED",
    secondary: "#EC4899",
    background: "#F7F8FC",
    surface: "#FFFFFF",
    surfaceVariant: "#F1F3F8",
    text: "#171827",
    textSecondary: "#667085",
    border: "#E4E7EC",
    success: "#10B981",
    error: "#EF4444",
    warning: "#F59E0B",
    info: "#3B82F6",
    transparent: "rgba(0, 0, 0, 0)",
  },
};

const darkTheme: Theme = {
  dark: true,
  colors: {
    primary: "#A78BFA",
    secondary: "#F472B6",
    background: "#0F1117",
    surface: "#171A22",
    surfaceVariant: "#232733",
    text: "#F8FAFC",
    textSecondary: "#A7B0C0",
    border: "#303645",
    success: "#34D399",
    error: "#F87171",
    warning: "#FBBF24",
    info: "#60A5FA",
    transparent: "rgba(0, 0, 0, 0)",
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const colorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(colorScheme === "dark");

  useEffect(() => {
    if (colorScheme !== null) {
      setIsDark(colorScheme === "dark");
    }
  }, [colorScheme]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const theme = isDark ? darkTheme : lightTheme;

  const value: ThemeContextType = {
    theme,
    isDark,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  }
  return context;
};
