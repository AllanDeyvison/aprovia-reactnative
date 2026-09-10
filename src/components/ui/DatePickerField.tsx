import React, { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";

interface DatePickerFieldProps {
  label: string;
  value: string;
  onChange: (isoDate: string) => void;
  error?: string;
  disabled?: boolean;
}

const WEEK = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function parseISO(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
}

function toISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatBR(value: string) {
  const parsed = parseISO(value);
  if (!parsed) return "Selecionar data";
  return `${String(parsed.getDate()).padStart(2, "0")}/${String(parsed.getMonth() + 1).padStart(2, "0")}/${parsed.getFullYear()}`;
}

export function DatePickerField({ label, value, onChange, error, disabled }: DatePickerFieldProps) {
  const { theme } = useTheme();
  const initial = parseISO(value) ?? new Date(new Date().getFullYear() - 18, new Date().getMonth(), new Date().getDate(), 12);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1, 12));
  const selected = parseISO(value);

  const cells = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstWeekday = new Date(year, month, 1, 12).getDay();
    const daysInMonth = new Date(year, month + 1, 0, 12).getDate();
    return Array.from({ length: 42 }, (_, index) => {
      const day = index - firstWeekday + 1;
      return day >= 1 && day <= daysInMonth ? day : null;
    });
  }, [visibleMonth]);

  const choose = (day: number) => {
    const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day, 12);
    if (date.getTime() > Date.now()) return;
    onChange(toISO(date));
    setOpen(false);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${value ? formatBR(value) : "Nenhuma data selecionada"}`}
        disabled={disabled}
        onPress={() => {
          const base = parseISO(value) ?? initial;
          setVisibleMonth(new Date(base.getFullYear(), base.getMonth(), 1, 12));
          setOpen(true);
        }}
        style={({ pressed }) => [
          styles.field,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.error : pressed ? theme.colors.primary : theme.colors.border,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        <CalendarDays size={20} color={theme.colors.primary} />
        <Text style={[styles.value, { color: value ? theme.colors.text : theme.colors.textSecondary }]}>
          {formatBR(value)}
        </Text>
        <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>DD/MM/AAAA</Text>
      </Pressable>
      {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} accessibilityLabel="Fechar calendário" />
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalEyebrow, { color: theme.colors.primary }]}>Data de nascimento</Text>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Escolha uma data</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Fechar calendário" onPress={() => setOpen(false)} style={styles.iconButton}>
                <X size={21} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.monthRow}>
              <Pressable accessibilityRole="button" accessibilityLabel="Mês anterior" style={[styles.navButton, { backgroundColor: theme.colors.surfaceVariant }]} onPress={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1, 12))}>
                <ChevronLeft size={20} color={theme.colors.text} />
              </Pressable>
              <Text style={[styles.monthText, { color: theme.colors.text }]}>{MONTHS[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Próximo mês" style={[styles.navButton, { backgroundColor: theme.colors.surfaceVariant }]} onPress={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1, 12))}>
                <ChevronRight size={20} color={theme.colors.text} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {WEEK.map((day, index) => <Text key={`${day}-${index}`} style={[styles.weekDay, { color: theme.colors.textSecondary }]}>{day}</Text>)}
            </View>
            <View style={styles.grid}>
              {cells.map((day, index) => {
                if (!day) return <View key={`empty-${index}`} style={styles.dayCell} />;
                const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day, 12);
                const isSelected = !!selected && selected.getFullYear() === date.getFullYear() && selected.getMonth() === date.getMonth() && selected.getDate() === day;
                const future = date.getTime() > Date.now();
                return (
                  <View key={`${visibleMonth.getFullYear()}-${visibleMonth.getMonth()}-${day}`} style={styles.dayCell}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${day} de ${MONTHS[visibleMonth.getMonth()]} de ${visibleMonth.getFullYear()}`}
                      disabled={future}
                      onPress={() => choose(day)}
                      style={({ pressed }) => [
                        styles.dayButton,
                        isSelected && { backgroundColor: theme.colors.primary },
                        pressed && !isSelected && { backgroundColor: theme.colors.surfaceVariant },
                        future && { opacity: 0.28 },
                      ]}
                    >
                      <Text style={[styles.dayText, { color: isSelected ? "#FFFFFF" : theme.colors.text }]}>{day}</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
            <Text style={[styles.footerHint, { color: theme.colors.textSecondary }]}>A data é enviada ao servidor em YYYY-MM-DD.</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: "700", marginBottom: 7 },
  field: { minHeight: 54, borderWidth: 1, borderRadius: 16, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", gap: 10 },
  value: { flex: 1, fontSize: 16, fontWeight: "600" },
  hint: { fontSize: 11, fontWeight: "600" },
  error: { fontSize: 12, fontWeight: "600", marginTop: 5 },
  overlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.52)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalCard: { width: "100%", maxWidth: 390, borderWidth: 1, borderRadius: 24, padding: 18, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 28, shadowOffset: { width: 0, height: 12 }, elevation: 12 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  modalEyebrow: { fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.7 },
  modalTitle: { fontSize: 22, fontWeight: "800", marginTop: 2 },
  iconButton: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  monthRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  navButton: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  monthText: { fontSize: 15, fontWeight: "800" },
  weekRow: { flexDirection: "row" },
  weekDay: { width: "14.285714%", textAlign: "center", fontSize: 11, fontWeight: "800", paddingVertical: 7 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: { width: "14.285714%", aspectRatio: 1, padding: 2 },
  dayButton: { flex: 1, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  dayText: { fontSize: 13, fontWeight: "700" },
  footerHint: { fontSize: 11, textAlign: "center", marginTop: 12 },
});
