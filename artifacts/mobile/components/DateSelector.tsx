import React from "react";
import { ScrollView, Pressable, Text, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  selectedDate: string;
  onSelect: (date: string) => void;
}

function getDates(): { date: string; top: string; bottom: string }[] {
  const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  const result = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const dd = d.getDate().toString();
    const mm = (d.getMonth() + 1).toString().padStart(2, "0");
    const numDate = `${dd}.${mm}`;
    let top: string;
    let bottom: string;
    if (i === 0) {
      top = "Сегодня";
      bottom = numDate;
    } else if (i === 1) {
      top = "Завтра";
      bottom = numDate;
    } else {
      top = days[d.getDay()];
      bottom = numDate;
    }
    result.push({ date: dateStr, top, bottom });
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
            <Text style={[styles.topLabel, { color: selected ? "#fff" : C.textMuted }]}>
              {d.top}
            </Text>
            <Text style={[styles.bottomLabel, { color: selected ? "#fff" : C.text }]}>
              {d.bottom}
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    minWidth: 64,
  },
  topLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.2,
  },
  bottomLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginTop: 2,
  },
});
