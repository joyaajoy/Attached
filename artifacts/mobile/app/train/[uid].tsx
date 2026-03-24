import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { useTickets } from "@/hooks/useTickets";
import type { TrainSegment } from "@workspace/api-client-react";

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso.slice(11, 16);
  }
}

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h} ч ${m} мин` : `${m} мин`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function InfoRow({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) {
  const { C } = useTheme();
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: (color || C.tint) + "18" }]}>
        <Ionicons name={icon as any} size={18} color={color || C.tint} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: C.textMuted }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: C.text }]}>{value}</Text>
      </View>
    </View>
  );
}

export default function TrainDetailScreen() {
  const { C } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const segment: TrainSegment | null = params.data ? JSON.parse(params.data as string) : null;
  const date = params.date as string || new Date().toISOString().split("T")[0];

  const { data: ticketsData, save, isSaving } = useTickets();
  const isSaved = ticketsData?.tickets?.some(t => t.segment.uid === segment?.uid) ?? false;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = (Platform.OS === "web" ? 34 : insets.bottom) + 20;

  if (!segment) {
    return (
      <View style={[styles.container, { backgroundColor: C.background }]}>
        <Text style={[styles.errorText, { color: C.textMuted }]}>Рейс не найден</Text>
      </View>
    );
  }

  const handleSave = async () => {
    if (isSaved) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await save(segment, date);
      Alert.alert("Сохранено", "Рейс добавлен в Мои билеты");
    } catch {
      Alert.alert("Ошибка", "Не удалось сохранить рейс");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={C.tint} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: C.text }]}>Рейс №{segment.number}</Text>
          <Text style={[styles.headerSub, { color: C.textMuted }]}>{segment.title}</Text>
        </View>
        <Pressable style={styles.saveBtn} onPress={handleSave} disabled={isSaved || isSaving}>
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={24}
            color={isSaved ? C.tint : C.textMuted}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: bottomPad }}>
        <View style={[styles.routeCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={styles.routeMain}>
            <View style={styles.stationBlock}>
              <Text style={[styles.bigTime, { color: C.text }]}>{formatTime(segment.departure)}</Text>
              <Text style={[styles.stationName, { color: C.text }]} numberOfLines={2}>
                {segment.from_station.title}
              </Text>
              {segment.from_station.popular_title ? (
                <Text style={[styles.stationSub, { color: C.textMuted }]}>{segment.from_station.popular_title}</Text>
              ) : null}
            </View>

            <View style={styles.middleBlock}>
              <Text style={[styles.durLabel, { color: C.textMuted }]}>{formatDuration(segment.duration)}</Text>
              <View style={styles.durationLine}>
                <View style={[styles.dot, { backgroundColor: C.green }]} />
                <View style={[styles.line, { backgroundColor: C.border }]} />
                <Ionicons name="train" size={18} color={C.tint} />
                <View style={[styles.line, { backgroundColor: C.border }]} />
                <View style={[styles.dot, { backgroundColor: C.tint }]} />
              </View>
              <Text style={[styles.dateLabel, { color: C.textMuted }]}>{formatDate(date)}</Text>
            </View>

            <View style={[styles.stationBlock, { alignItems: "flex-end" }]}>
              <Text style={[styles.bigTime, { color: C.text }]}>{formatTime(segment.arrival)}</Text>
              <Text style={[styles.stationName, { color: C.text, textAlign: "right" }]} numberOfLines={2}>
                {segment.to_station.title}
              </Text>
              {segment.to_station.popular_title ? (
                <Text style={[styles.stationSub, { color: C.textMuted }]}>{segment.to_station.popular_title}</Text>
              ) : null}
            </View>
          </View>

          {segment.price_min ? (
            <View style={[styles.priceBlock, { borderTopColor: C.border, backgroundColor: C.tint + "10" }]}>
              <Ionicons name="pricetag" size={16} color={C.tint} />
              <Text style={[styles.priceText, { color: C.tint }]}>
                {segment.price_min}{segment.price_max && segment.price_max !== segment.price_min ? `–${segment.price_max}` : ""} ₽
              </Text>
              <Text style={[styles.priceNote, { color: C.textMuted }]}>стоимость проезда</Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.infoCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.infoCardTitle, { color: C.text }]}>Детали рейса</Text>
          <InfoRow icon="train-outline" label="Номер рейса" value={segment.number} />
          {segment.transport_subtype && (
            <InfoRow icon="flash-outline" label="Тип поезда" value={segment.transport_subtype} color={C.orange} />
          )}
          {segment.thread_express_type && (
            <InfoRow icon="speedometer-outline" label="Категория" value={segment.thread_express_type} color={C.orange} />
          )}
          <InfoRow icon="time-outline" label="Время в пути" value={formatDuration(segment.duration)} />
          {segment.stops && (
            <InfoRow icon="location-outline" label="Остановки" value={segment.stops} />
          )}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.saveFullBtn,
            { backgroundColor: isSaved ? C.surfaceSecondary : C.tint, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={handleSave}
          disabled={isSaved || isSaving}
        >
          <Ionicons name={isSaved ? "checkmark-circle" : "bookmark-outline"} size={20} color={isSaved ? C.textMuted : "#fff"} />
          <Text style={[styles.saveFullText, { color: isSaved ? C.textMuted : "#fff" }]}>
            {isSaved ? "Уже сохранён" : "Сохранить в Мои билеты"}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 4,
  },
  backBtn: { padding: 8 },
  saveBtn: { padding: 8 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  headerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  routeCard: {
    margin: 16,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  routeMain: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 8,
  },
  stationBlock: { flex: 1, gap: 4 },
  bigTime: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
  },
  stationName: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
  },
  stationSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  middleBlock: {
    width: 90,
    alignItems: "center",
    gap: 6,
  },
  durLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  durationLine: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 2,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  line: { flex: 1, height: 1 },
  dateLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  priceBlock: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  priceText: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  priceNote: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  infoCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  infoCardTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: { flex: 1, gap: 1 },
  infoLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  infoValue: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  saveFullBtn: {
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
  },
  saveFullText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 40,
  },
});
