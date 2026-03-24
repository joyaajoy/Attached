import React, { useState, useCallback, useMemo } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { useTheme } from "@/hooks/useTheme";
import { useScheduleQuery } from "@/hooks/useSchedule";
import { useTickets } from "@/hooks/useTickets";
import { TrainCard } from "@/components/TrainCard";
import { DateSelector } from "@/components/DateSelector";
import { StationPicker } from "@/components/StationPicker";
import type { Station, TrainSegment } from "@workspace/api-client-react";

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

type PickerTarget = "from" | "to" | null;

export default function ScheduleScreen() {
  const { C, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [fromStation, setFromStation] = useState<Station | null>(null);
  const [toStation, setToStation] = useState<Station | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);

  const { data: tickets } = useTickets();
  const savedIds = useMemo(() => new Set((tickets?.tickets ?? []).map(t => t.segment.uid)), [tickets]);
  const { save: saveTicket } = useTickets();

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

  const handleSave = useCallback(async (seg: TrainSegment) => {
    try {
      await saveTicket(seg, selectedDate);
    } catch (e) {
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

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <Text style={[styles.headerTitle, { color: C.text }]}>Расписание</Text>
        <Text style={[styles.headerSub, { color: C.textMuted }]}>Электрички России</Text>

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

        <DateSelector selectedDate={selectedDate} onSelect={setSelectedDate} />
      </View>

      {!fromStation || !toStation ? (
        <Animated.View entering={FadeIn} style={styles.emptyContainer}>
          <Ionicons name="train-outline" size={64} color={C.border} />
          <Text style={[styles.emptyTitle, { color: C.text }]}>Куда едем?</Text>
          <Text style={[styles.emptyText, { color: C.textMuted }]}>
            Выберите станции отправления и прибытия
          </Text>
        </Animated.View>
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
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 16,
    marginTop: 8,
  },
  headerSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 16,
    marginBottom: 14,
    marginTop: 2,
  },
  searchCard: {
    marginHorizontal: 16,
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
  stationName: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  stationSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  stationPlaceholder: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
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
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  retryText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
});
