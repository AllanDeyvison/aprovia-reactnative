export type AprovIAModel = "llama3" | "qwen2-math";

export function getModelAppearance(model: AprovIAModel, isDark: boolean) {
  if (model === "qwen2-math") {
    return {
      label: "Matemática",
      shortLabel: "Matemática",
      accent: isDark ? "#60A5FA" : "#2563EB",
      accentStrong: isDark ? "#3B82F6" : "#1D4ED8",
      soft: isDark ? "rgba(59, 130, 246, 0.16)" : "#EFF6FF",
      border: isDark ? "rgba(96, 165, 250, 0.40)" : "#BFDBFE",
    };
  }

  return {
    label: "Inglês",
    shortLabel: "Inglês",
    accent: isDark ? "#F87171" : "#DC2626",
    accentStrong: isDark ? "#EF4444" : "#B91C1C",
    soft: isDark ? "rgba(239, 68, 68, 0.14)" : "#FEF2F2",
    border: isDark ? "rgba(248, 113, 113, 0.38)" : "#FECACA",
  };
}
