import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeOut, Layout } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { useTickets } from "@/hooks/useTickets";
import type { Ticket } from "@workspace/api-client-react";

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso.slice(11, 16);
  }
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h} ч ${m} мин` : `${m} мин`;
}

function TicketItem({ ticket, onDelete }: { ticket: Ticket; onDelete: (id: string) => void }) {
  const { C } = useTheme();
  const seg = ticket.segment;
  const isPast = new Date(ticket.date) < new Date(new Date().toDateString());

  const handleDelete = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Удалить билет?", "Это действие нельзя отменить.", [
      { text: "Отмена", style: "cancel" },
      { text: "Удалить", style: "destructive", onPress: () => onDelete(ticket.id) },
    ]);
  };

  return (
    <Animated.View
      entering={FadeInDown.springify()}
      exiting={FadeOut}
      layout={Layout.springify()}
    >
      <View style={[styles.ticketCard, { backgroundColor: C.surface, borderColor: C.border, opacity: isPast ? 0.6 : 1 }]}>
        <View style={[styles.ticketStrip, { backgroundColor: isPast ? C.textMuted : C.tint }]} />

        <View style={styles.ticketBody}>
          <View style={styles.ticketHeader}>
            <View style={[styles.statusBadge, { backgroundColor: isPast ? C.surfaceSecondary : C.tint + "18" }]}>
              <Ionicons
                name={isPast ? "checkmark-circle" : "radio-button-on"}
                size={12}
                color={isPast ? C.textMuted : C.tint}
              />
              <Text style={[styles.statusText, { color: isPast ? C.textMuted : C.tint }]}>
                {isPast ? "Использован" : "Активен"}
              </Text>
            </View>
            <Text style={[styles.dateText, { color: C.textMuted }]}>{formatDate(ticket.date)}</Text>
          </View>

          <View style={styles.routeRow}>
            <View style={styles.timeBlock}>
              <Text style={[styles.time, { color: C.text }]}>{formatTime(seg.departure)}</Text>
              <Text style={[styles.stationName, { color: C.textSecondary }]} numberOfLines={1}>
                {seg.from_station.short_title || seg.from_station.title}
              </Text>
            </View>

            <View style={styles.durationBlock}>
              <Text style={[styles.duration, { color: C.textMuted }]}>{formatDuration(seg.duration)}</Text>
              <View style={styles.durationLine}>
                <View style={[styles.dot, { backgroundColor: C.tint }]} />
                <View style={[styles.line, { backgroundColor: C.border }]} />
                <Ionicons name="train-outline" size={12} color={C.tint} />
                <View style={[styles.line, { backgroundColor: C.border }]} />
                <View style={[styles.dot, { backgroundColor: C.tint }]} />
              </View>
            </View>

            <View style={[styles.timeBlock, { alignItems: "flex-end" }]}>
              <Text style={[styles.time, { color: C.text }]}>{formatTime(seg.arrival)}</Text>
              <Text style={[styles.stationName, { color: C.textSecondary }]} numberOfLines={1}>
                {seg.to_station.short_title || seg.to_station.title}
              </Text>
            </View>
          </View>

          <View style={[styles.ticketFooter, { borderTopColor: C.border }]}>
            <Text style={[styles.trainNum, { color: C.textMuted }]}>№{seg.number} · {seg.title}</Text>
            {seg.price_min ? (
              <Text style={[styles.price, { color: C.tint }]}>{seg.price_min} ₽</Text>
            ) : null}
            <Pressable onPress={handleDelete} hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color={C.red} />
            </Pressable>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default function TicketsScreen() {
  const { C } = useTheme();
  const insets = useSafeAreaInsets();
  const { data, isLoading, remove } = useTickets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = (Platform.OS === "web" ? 34 : insets.bottom) + 90;

  const tickets = data?.tickets ?? [];
  const active = useMemo(() => tickets.filter(t => {
    const d = new Date(t.date);
    return d >= new Date(new Date().toDateString());
  }), [tickets]);
  const past = useMemo(() => tickets.filter(t => {
    const d = new Date(t.date);
    return d < new Date(new Date().toDateString());
  }), [tickets]);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <Text style={[styles.headerTitle, { color: C.text }]}>Мои билеты</Text>
        <Text style={[styles.headerSub, { color: C.textMuted }]}>
          {tickets.length > 0 ? `${tickets.length} ${tickets.length === 1 ? "билет" : "билетов"}` : "Нет сохранённых билетов"}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.tint} />
        </View>
      ) : tickets.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="ticket-outline" size={64} color={C.border} />
          <Text style={[styles.emptyTitle, { color: C.text }]}>Нет билетов</Text>
          <Text style={[styles.emptyText, { color: C.textMuted }]}>
            Сохраняйте рейсы из расписания, нажав на иконку закладки
          </Text>
        </View>
      ) : (
        <FlatList
          data={[...active, ...past]}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: bottomPad }}
          ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
          ListHeaderComponent={active.length > 0 && past.length > 0 ? () => (
            <Text style={[styles.sectionTitle, { color: C.textMuted }]}>Предстоящие</Text>
          ) : null}
          renderItem={({ item, index }) => {
            const isPastFirst = index === active.length && past.length > 0 && active.length > 0;
            return (
              <>
                {isPastFirst && (
                  <Text style={[styles.sectionTitle, { color: C.textMuted, marginTop: 8 }]}>Прошедшие</Text>
                )}
                <TicketItem ticket={item} onDelete={remove} />
              </>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginTop: 8,
  },
  headerSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  center: {
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
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  ticketCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
  },
  ticketStrip: {
    width: 4,
  },
  ticketBody: {
    flex: 1,
    padding: 14,
  },
  ticketHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  dateText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  timeBlock: {
    minWidth: 80,
    gap: 2,
  },
  time: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  stationName: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  durationBlock: {
    flex: 1,
    alignItems: "center",
  },
  duration: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  durationLine: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  line: {
    flex: 1,
    height: 1,
  },
  ticketFooter: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 8,
  },
  trainNum: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  price: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
