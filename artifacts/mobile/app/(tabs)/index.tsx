import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  Platform,
  Modal,
  RefreshControl,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { useTheme } from "@/hooks/useTheme";
import { useScheduleQuery } from "@/hooks/useSchedule";
import { useTickets } from "@/hooks/useTickets";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { TrainCard } from "@/components/TrainCard";
import { DateSelector } from "@/components/DateSelector";
import { StationPicker } from "@/components/StationPicker";
import type { Station, TrainSegment } from "@workspace/api-client-react";

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
}

type PickerTarget = "from" | "to" | null;

export default function ScheduleScreen() {
  const { C } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [fromStation, setFromStation] = useState<Station | null>(null);
  const [toStation, setToStation] = useState<Station | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);

  const { history, addSearch, clearHistory } = useSearchHistory();
  const { data: tickets } = useTickets();
  const savedIds = useMemo(() => new Set((tickets?.tickets ?? []).map(t => t.segment.uid)), [tickets]);
  const { save: saveTicket } = useTickets();

  const isSearching = !!(fromStation && toStation);

  const {
    data: schedule,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useScheduleQuery(
    fromStation?.code ?? "",
    toStation?.code ?? "",
    selectedDate
  );

  useEffect(() => {
    if (fromStation && toStation && schedule && !isLoading) {
      addSearch(fromStation, toStation, selectedDate);
    }
  }, [schedule, isLoading]);

  const allSegments = useMemo(() => {
    const s = schedule?.segments ?? [];
    const iv = schedule?.interval_segments ?? [];
    return [...s, ...iv];
  }, [schedule]);

  const handleSwap = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const tmp = fromStation;
    setFromStation(toStation);
    setToStation(tmp);
  };

  const handleReset = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFromStation(null);
    setToStation(null);
    setSelectedDate(todayStr());
  };

  const handleSave = useCallback(async (seg: TrainSegment) => {
    try {
      await saveTicket(seg, selectedDate);
    } catch {
      // ignore
    }
  }, [saveTicket, selectedDate]);

  const handleBuy = useCallback((seg: TrainSegment) => {
    router.push({ pathname: "/train/buy", params: { uid: seg.uid, data: JSON.stringify(seg), date: selectedDate } });
  }, [router, selectedDate]);

  const openPicker = (target: PickerTarget) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setPickerTarget(target);
  };

  const applyHistory = (entry: { from: Station; to: Station; date: string }) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFromStation(entry.from);
    setToStation(entry.to);
    setSelectedDate(entry.date);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.headerTitle, { color: C.text }]}>Расписание</Text>
          {isSearching && (
            <Pressable style={styles.resetBtn} onPress={handleReset} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color={C.textMuted} />
              <Text style={[styles.resetText, { color: C.textMuted }]}>Сбросить</Text>
            </Pressable>
          )}
        </View>

        <View style={[styles.searchCard, { backgroundColor: C.surfaceSecondary, borderColor: C.border }]}>
          <Pressable
            style={[styles.stationRow, { borderBottomColor: C.border }]}
            onPress={() => openPicker("from")}
          >
            <View style={[styles.stationDot, { backgroundColor: C.green }]} />
            <View style={styles.stationInfo}>
              {fromStation ? (
                <>
                  <Text style={[styles.stationName, { color: C.text }]}>{fromStation.title}</Text>
                  {fromStation.popular_title ? (
                    <Text style={[styles.stationSub, { color: C.textMuted }]}>{fromStation.popular_title}</Text>
                  ) : null}
                </>
              ) : (
                <Text style={[styles.stationPlaceholder, { color: C.textMuted }]}>Откуда</Text>
              )}
            </View>
          </Pressable>

          <Pressable
            style={[styles.swapBtn, { backgroundColor: C.surface, borderColor: C.border }]}
            onPress={handleSwap}
          >
            <Ionicons name="swap-vertical" size={18} color={C.tint} />
          </Pressable>

          <Pressable style={styles.stationRow} onPress={() => openPicker("to")}>
            <View style={[styles.stationDot, { backgroundColor: C.tint }]} />
            <View style={styles.stationInfo}>
              {toStation ? (
                <>
                  <Text style={[styles.stationName, { color: C.text }]}>{toStation.title}</Text>
                  {toStation.popular_title ? (
                    <Text style={[styles.stationSub, { color: C.textMuted }]}>{toStation.popular_title}</Text>
                  ) : null}
                </>
              ) : (
                <Text style={[styles.stationPlaceholder, { color: C.textMuted }]}>Куда</Text>
              )}
            </View>
          </Pressable>
        </View>

        {isSearching && <DateSelector selectedDate={selectedDate} onSelect={setSelectedDate} />}
      </View>

      {!isSearching ? (
        <ScrollView
          contentContainerStyle={{ paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 90 }}
          showsVerticalScrollIndicator={false}
        >
          {history.length === 0 ? (
            <Animated.View entering={FadeIn} style={styles.emptyContainer}>
              <Ionicons name="train-outline" size={64} color={C.border} />
              <Text style={[styles.emptyTitle, { color: C.text }]}>Куда едем?</Text>
              <Text style={[styles.emptyText, { color: C.textMuted }]}>
                Выберите станции отправления и прибытия
              </Text>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn}>
              <View style={styles.historyHeader}>
                <Text style={[styles.historyTitle, { color: C.textMuted }]}>История поиска</Text>
                <Pressable onPress={clearHistory} hitSlop={8}>
                  <Text style={[styles.historyClear, { color: C.tint }]}>Очистить</Text>
                </Pressable>
              </View>
              {history.map((entry, i) => (
                <Pressable
                  key={i}
                  style={({ pressed }) => [
                    styles.historyItem,
                    { backgroundColor: C.surface, borderColor: C.border, opacity: pressed ? 0.75 : 1 },
                  ]}
                  onPress={() => applyHistory(entry)}
                >
                  <View style={styles.historyLeft}>
                    <View style={styles.historyRoute}>
                      <View style={[styles.historyDot, { backgroundColor: C.green }]} />
                      <Text style={[styles.historyStation, { color: C.text }]} numberOfLines={1}>
                        {entry.from.short_title || entry.from.title}
                      </Text>
                    </View>
                    <View style={[styles.historyConnector, { backgroundColor: C.border }]} />
                    <View style={styles.historyRoute}>
                      <View style={[styles.historyDot, { backgroundColor: C.tint }]} />
                      <Text style={[styles.historyStation, { color: C.text }]} numberOfLines={1}>
                        {entry.to.short_title || entry.to.title}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={[styles.historyDate, { color: C.textMuted }]}>{formatDate(entry.date)}</Text>
                    <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
                  </View>
                </Pressable>
              ))}
            </Animated.View>
          )}
        </ScrollView>
      ) : isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.tint} />
          <Text style={[styles.loadingText, { color: C.textMuted }]}>Загружаем расписание...</Text>
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={C.textMuted} />
          <Text style={[styles.emptyTitle, { color: C.text }]}>Нет соединения</Text>
          <Pressable style={[styles.retryBtn, { backgroundColor: C.tint }]} onPress={() => refetch()}>
            <Text style={styles.retryText}>Повторить</Text>
          </Pressable>
        </View>
      ) : allSegments.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="calendar-outline" size={48} color={C.textMuted} />
          <Text style={[styles.emptyTitle, { color: C.text }]}>Рейсов нет</Text>
          <Text style={[styles.emptyText, { color: C.textMuted }]}>
            На выбранную дату рейсов не найдено
          </Text>
        </View>
      ) : (
        <FlatList
          data={allSegments}
          keyExtractor={(item) => item.uid}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={C.tint} />}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 90 }}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
              <TrainCard
                segment={item}
                isSaved={savedIds.has(item.uid)}
                onSave={handleSave}
                onPress={() => router.push({ pathname: "/train/[uid]", params: { uid: item.uid, data: JSON.stringify(item), date: selectedDate } })}
                onBuy={handleBuy}
              />
            </Animated.View>
          )}
        />
      )}

      <Modal visible={pickerTarget !== null} animationType="slide" presentationStyle="pageSheet">
        {pickerTarget !== null && (
          <StationPicker
            placeholder={pickerTarget === "from" ? "Откуда" : "Куда"}
            onSelect={(station) => {
              if (pickerTarget === "from") setFromStation(station);
              else setToStation(station);
            }}
            onClose={() => setPickerTarget(null)}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    borderBottomWidth: 1,
    paddingBottom: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  resetText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  searchCard: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  stationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  stationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stationInfo: { flex: 1, gap: 1 },
  stationName: { fontSize: 16, fontFamily: "Inter_500Medium" },
  stationSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  stationPlaceholder: { fontSize: 16, fontFamily: "Inter_400Regular" },
  swapBtn: {
    position: "absolute",
    right: 14,
    top: "50%",
    marginTop: -17,
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  historyTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  historyClear: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  historyItem: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  historyLeft: { flex: 1, gap: 4 },
  historyRoute: { flexDirection: "row", alignItems: "center", gap: 8 },
  historyDot: { width: 8, height: 8, borderRadius: 4 },
  historyConnector: { width: 1, height: 8, marginLeft: 3.5 },
  historyStation: { fontSize: 15, fontFamily: "Inter_500Medium", flex: 1 },
  historyRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  historyDate: { fontSize: 13, fontFamily: "Inter_400Regular" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  retryText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
