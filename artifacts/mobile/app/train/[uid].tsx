import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { useTickets } from "@/hooks/useTickets";
import type { TrainSegment } from "@workspace/api-client-react";

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "http://localhost:3001";

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    if (iso.length <= 8) return iso.slice(0, 5);
    return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso.slice(0, 5);
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

type Stop = {
  station: { title: string; short_title: string; popular_title: string; code: string };
  arrival: string | null;
  departure: string | null;
  duration: number | null;
  stop_time: number | null;
};

export default function TrainDetailScreen() {
  const { C } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const segment: TrainSegment | null = params.data ? JSON.parse(params.data as string) : null;
  const date = (params.date as string) || new Date().toISOString().split("T")[0];

  const { data: ticketsData, save, isSaving } = useTickets();
  const isSaved = ticketsData?.tickets?.some(t => t.segment.uid === segment?.uid) ?? false;

  const [stops, setStops] = useState<Stop[]>([]);
  const [stopsLoading, setStopsLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = (Platform.OS === "web" ? 34 : insets.bottom) + 16;

  useEffect(() => {
    if (!segment?.uid) return;
    setStopsLoading(true);
    fetch(`${BASE_URL}/api/schedule/thread?uid=${encodeURIComponent(segment.uid)}&date=${date}`)
      .then(r => r.ok ? r.json() : { stops: [] })
      .then(d => setStops(d.stops || []))
      .catch(() => setStops([]))
      .finally(() => setStopsLoading(false));
  }, [segment?.uid, date]);

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

  const handleBuy = () => {
    router.push({ pathname: "/train/buy", params: { uid: segment.uid, data: JSON.stringify(segment), date } });
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

      <ScrollView contentContainerStyle={{ paddingBottom: bottomPad + 80 }}>
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

        <Text style={[styles.sectionTitle, { color: C.textMuted }]}>Маршрут и остановки</Text>

        <View style={[styles.stopsCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          {stopsLoading ? (
            <View style={styles.stopsLoading}>
              <ActivityIndicator size="small" color={C.tint} />
              <Text style={[styles.stopsLoadingText, { color: C.textMuted }]}>Загружаем остановки...</Text>
            </View>
          ) : stops.length === 0 ? (
            <View style={styles.stopsLoading}>
              <Ionicons name="information-circle-outline" size={18} color={C.textMuted} />
              <Text style={[styles.stopsLoadingText, { color: C.textMuted }]}>Нет данных об остановках</Text>
            </View>
          ) : (
            stops.map((stop, i) => {
              const isFirst = i === 0;
              const isLast = i === stops.length - 1;
              const time = stop.departure ?? stop.arrival;
              return (
                <View key={i} style={styles.stopRow}>
                  <View style={styles.stopTimeline}>
                    <View style={[
                      styles.stopDot,
                      {
                        backgroundColor: isFirst || isLast ? C.tint : C.surface,
                        borderColor: isFirst || isLast ? C.tint : C.border,
                        borderWidth: isFirst || isLast ? 0 : 2,
                        width: isFirst || isLast ? 12 : 8,
                        height: isFirst || isLast ? 12 : 8,
                      },
                    ]} />
                    {!isLast && <View style={[styles.stopLine, { backgroundColor: C.border }]} />}
                  </View>
                  <View style={[styles.stopContent, !isLast && { paddingBottom: 16 }]}>
                    <Text style={[styles.stopTime, { color: isFirst || isLast ? C.text : C.textSecondary }]}>
                      {time ? formatTime(time) : "—"}
                    </Text>
                    <View style={styles.stopNameRow}>
                      <Text
                        style={[
                          styles.stopName,
                          { color: isFirst || isLast ? C.text : C.textSecondary },
                          (isFirst || isLast) && { fontFamily: "Inter_600SemiBold" },
                        ]}
                        numberOfLines={2}
                      >
                        {stop.station.title}
                        {isFirst ? "  ·  Отправление" : isLast ? "  ·  Прибытие" : ""}
                      </Text>
                    </View>
                    {stop.stop_time && stop.stop_time > 0 ? (
                      <Text style={[styles.stopDwell, { color: C.textMuted }]}>стоянка {stop.stop_time} мин</Text>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad, backgroundColor: C.surface, borderTopColor: C.border }]}>
        <Pressable
          style={({ pressed }) => [styles.buyBtn, { backgroundColor: C.tint, opacity: pressed ? 0.88 : 1 }]}
          onPress={handleBuy}
        >
          <Ionicons name="card-outline" size={20} color="#fff" />
          <Text style={styles.buyBtnText}>
            {segment.price_min ? `Купить · от ${segment.price_min} ₽` : "Купить билет"}
          </Text>
        </Pressable>
      </View>
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
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
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
  bigTime: { fontSize: 32, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  stationName: { fontSize: 14, fontFamily: "Inter_500Medium", lineHeight: 20 },
  stationSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  middleBlock: { width: 90, alignItems: "center", gap: 6 },
  durLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  durationLine: { flexDirection: "row", alignItems: "center", width: "100%", gap: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  line: { flex: 1, height: 1 },
  dateLabel: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
  priceBlock: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  priceText: { fontSize: 20, fontFamily: "Inter_700Bold" },
  priceNote: { fontSize: 13, fontFamily: "Inter_400Regular" },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    paddingBottom: 8,
    marginTop: 4,
  },
  stopsCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    paddingBottom: 4,
    marginBottom: 16,
  },
  stopsLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  stopsLoadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  stopRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  stopTimeline: {
    alignItems: "center",
    width: 20,
    paddingTop: 3,
  },
  stopDot: {
    borderRadius: 10,
  },
  stopLine: {
    width: 2,
    flex: 1,
    minHeight: 24,
    marginTop: 4,
  },
  stopContent: {
    flex: 1,
    paddingBottom: 4,
    gap: 1,
  },
  stopTime: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.3,
  },
  stopNameRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  stopName: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
    flexShrink: 1,
  },
  stopDwell: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  buyBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buyBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  errorText: { fontSize: 16, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 40 },
});
