import React, { useRef } from "react";
import { ScrollView, Pressable, Text, StyleSheet, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  selectedDate: string;
  onSelect: (date: string) => void;
}

function getDates(): { date: string; label: string; dayLabel: string }[] {
  const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  const months = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  const result = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const dayLabel = i === 0 ? "Сегодня" : i === 1 ? "Завтра" : days[d.getDay()];
    const label = `${d.getDate()} ${months[d.getMonth()]}`;
    result.push({ date: dateStr, label, dayLabel });
  }
  return result;
}

export function DateSelector({ selectedDate, onSelect }: Props) {
  const { C } = useTheme();
  const dates = getDates();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {dates.map((d) => {
        const selected = d.date === selectedDate;
        return (
          <Pressable
            key={d.date}
            style={[
              styles.item,
              { borderColor: selected ? C.tint : C.border, backgroundColor: selected ? C.tint : C.surface },
            ]}
            onPress={() => onSelect(d.date)}
          >
            <Text style={[styles.dayLabel, { color: selected ? "#fff" : C.textMuted }]}>
              {d.dayLabel}
            </Text>
            <Text style={[styles.dateLabel, { color: selected ? "#fff" : C.text }]}>
              {d.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  item: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    minWidth: 68,
  },
  dayLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.2,
  },
  dateLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginTop: 1,
  },
});
