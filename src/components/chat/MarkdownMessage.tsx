import React, { Fragment } from "react";
import { TextStyle, ViewStyle } from "react-native";
import { useMarkdown } from "react-native-marked";
import { useTheme } from "@/contexts/ThemeContext";

export function MarkdownMessage({ value, inverted = false }: { value: string; inverted?: boolean }) {
  const { theme } = useTheme();
  const foreground = inverted ? "#FFFFFF" : theme.colors.text;
  const muted = inverted ? "rgba(255,255,255,0.82)" : theme.colors.textSecondary;
  const elements = useMarkdown(value || "", {
    colorScheme: theme.dark ? "dark" : "light",
    theme: {
      colors: {
        text: foreground,
        code: inverted ? "rgba(255,255,255,0.12)" : theme.colors.surfaceVariant,
        link: inverted ? "#FFFFFF" : theme.colors.info,
        border: inverted ? "rgba(255,255,255,0.25)" : theme.colors.border,
        background: inverted ? "rgba(255,255,255,0.10)" : theme.colors.surfaceVariant,
      },
    },
    styles: {
      text: { color: foreground, fontSize: 16, lineHeight: 24 } as TextStyle,
      paragraph: { marginTop: 0, marginBottom: 8 } as ViewStyle,
      link: { color: inverted ? "#FFFFFF" : theme.colors.info, textDecorationLine: "underline" } as TextStyle,
      blockquote: { color: muted, borderLeftColor: inverted ? "rgba(255,255,255,0.35)" : theme.colors.border } as any,
      codespan: { color: foreground, backgroundColor: inverted ? "rgba(255,255,255,0.12)" : theme.colors.surfaceVariant } as any,
      code: { color: foreground, backgroundColor: inverted ? "rgba(255,255,255,0.10)" : theme.colors.surfaceVariant } as any,
    },
  });

  return <>{elements.map((element, index) => <Fragment key={`md-${index}`}>{element}</Fragment>)}</>;
}
