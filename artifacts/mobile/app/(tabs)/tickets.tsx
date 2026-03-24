import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  FadeOut,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeIn,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import QRCode from "react-native-qrcode-svg";

import { useTheme } from "@/hooks/useTheme";
import { useTickets } from "@/hooks/useTickets";
import type { Ticket } from "@workspace/api-client-react";

const { width: SW } = Dimensions.get("window");
const QR_DETAIL_SIZE = Math.min(SW - 96, 280);

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso.slice(11, 16);
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatDatetime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) +
      ", " + d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h} ч ${m} мин` : `${m} мин`;
}

function getPDNumber(ticketId: string): string {
  let hash = 0;
  for (let i = 0; i < ticketId.length; i++) {
    const c = ticketId.charCodeAt(i);
    hash = (Math.imul(31, hash) + c) | 0;
  }
  return (Math.abs(hash) % 900000000 + 100000000).toString();
}

function buildQrData(ticket: Ticket): string {
  const seg = ticket.segment;
  const pd = getPDNumber(ticket.id);
  return [
    `PD:${pd}`,
    `FROM:${seg.from_station.title}`,
    `TO:${seg.to_station.title}`,
    `DEP:${seg.departure}`,
    `ARR:${seg.arrival}`,
    `TRAIN:${seg.number}`,
    `DATE:${ticket.date}`,
  ].join("|");
}

function getTrainCategory(seg: Ticket["segment"]): string {
  const expr = (seg.thread_express_type || "").toLowerCase();
  const sub = (seg.transport_subtype || "").toLowerCase();
  if (expr.includes("express") || sub.includes("express") || expr.includes("экспресс")) return "Экспресс";
  if (sub.includes("скоростн") || expr.includes("скоростн")) return "Скоростной";
  return "Стандарт";
}

function SpinningQR({ data, size }: { data: string; size: number }) {
  const { C } = useTheme();
  const rotY = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${rotY.value}deg` },
    ],
  }));

  const handleTap = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    rotY.value = withTiming(rotY.value + 360, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
  };

  return (
    <Pressable onPress={handleTap}>
      <Animated.View style={[styles.qrWhiteBox, animStyle]}>
        <QRCode value={data} size={size} backgroundColor="#fff" color="#000" />
      </Animated.View>
    </Pressable>
  );
}

function TicketDetailModal({ ticket, onClose, onDelete }: {
  ticket: Ticket;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const { C } = useTheme();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = (Platform.OS === "web" ? 34 : insets.bottom) + 16;
  const seg = ticket.segment;
  const isPast = new Date(ticket.date) < new Date(new Date().toDateString());
  const pd = getPDNumber(ticket.id);
  const qrData = buildQrData(ticket);
  const category = getTrainCategory(seg);

  const handleDelete = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Удалить билет?", "Это действие нельзя отменить.", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить", style: "destructive", onPress: () => {
          onDelete(ticket.id);
          onClose();
        }
      },
    ]);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.detailContainer, { backgroundColor: C.background }]}>
        <View style={[styles.detailHeader, { paddingTop: topPad + 8, backgroundColor: C.surface, borderBottomColor: C.border }]}>
          <Pressable style={styles.detailBack} onPress={onClose}>
            <Ionicons name="chevron-down" size={24} color={C.tint} />
          </Pressable>
          <Text style={[styles.detailHeaderTitle, { color: C.text }]}>Билет</Text>
          <Pressable style={styles.detailBack} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={C.red} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingTop: 20, paddingBottom: bottomPad + 20 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(250)} style={[styles.detailCard, { backgroundColor: C.surface, borderColor: C.tint + "40" }]}>
            <View style={[styles.detailStrip, { backgroundColor: isPast ? C.textMuted : C.tint }]} />
            <View style={styles.detailCardBody}>
              <View style={[styles.detailStatusRow]}>
                <View style={[styles.statusPill, { backgroundColor: isPast ? C.surfaceSecondary : C.tint + "18" }]}>
                  <Ionicons name={isPast ? "checkmark-circle" : "radio-button-on"} size={11} color={isPast ? C.textMuted : C.tint} />
                  <Text style={[styles.statusPillText, { color: isPast ? C.textMuted : C.tint }]}>
                    {isPast ? "Использован" : "Активен"}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRouteRow}>
                <Text style={[styles.detailStationName, { color: C.text }]} numberOfLines={2}>
                  {seg.from_station.short_title || seg.from_station.title}
                </Text>
                <View style={styles.detailArrowBlock}>
                  <View style={[styles.detailLine, { backgroundColor: C.border }]} />
                  <Ionicons name="arrow-forward" size={14} color={C.tint} />
                  <View style={[styles.detailLine, { backgroundColor: C.border }]} />
                </View>
                <Text style={[styles.detailStationName, { color: C.text, textAlign: "right" }]} numberOfLines={2}>
                  {seg.to_station.short_title || seg.to_station.title}
                </Text>
              </View>

              <Text style={[styles.detailMeta, { color: C.textSecondary }]}>
                {formatTime(seg.departure)} → {formatTime(seg.arrival)} · {formatDuration(seg.duration)}
              </Text>

              <View style={[styles.detailDivider, { backgroundColor: C.border }]} />

              <Text style={[styles.detailTicketType, { color: C.text }]}>
                Разовый билет в одну сторону
              </Text>
              <Text style={[styles.detailDate, { color: C.textSecondary }]}>
                {formatDate(ticket.date)}
              </Text>

              <View style={[styles.categoryBadge, { backgroundColor: C.surfaceSecondary, borderColor: C.border }]}>
                <Ionicons name="train-outline" size={14} color={C.textSecondary} />
                <Text style={[styles.categoryText, { color: C.textSecondary }]}>
                  Для поездов: {category}
                </Text>
                {category === "Стандарт" && (
                  <Text style={[styles.categoryNote, { color: C.textMuted }]}>(обычный пригородный поезд)</Text>
                )}
              </View>

              {!isPast && (
                <>
                  <View style={[styles.detailDivider, { backgroundColor: C.border }]} />
                  <View style={styles.qrCenteredBlock}>
                    <SpinningQR data={qrData} size={QR_DETAIL_SIZE} />
                    <Text style={[styles.qrScanHint, { color: C.textMuted }]}>
                      Нажмите на QR-код, чтобы прокрутить
                    </Text>
                  </View>
                  <Text style={[styles.scanLabel, { color: C.textSecondary }]}>
                    Просканируйте этот штрихкод на турникете.
                  </Text>
                  <Text style={[styles.scanSubLabel, { color: C.textMuted }]}>
                    Если возникли проблемы, обратитесь к работникам станции.
                  </Text>
                </>
              )}

              <View style={[styles.detailDivider, { backgroundColor: C.border }]} />

              <View style={styles.purchaseInfoBlock}>
                <View style={styles.purchaseRow}>
                  <Text style={[styles.purchaseLabel, { color: C.textMuted }]}>Приобретён</Text>
                  <Text style={[styles.purchaseValue, { color: C.text }]}>{formatDatetime(ticket.saved_at)}</Text>
                </View>
                <View style={styles.purchaseRow}>
                  <Text style={[styles.purchaseLabel, { color: C.textMuted }]}>№ПД</Text>
                  <Text style={[styles.purchaseValue, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>{pd}</Text>
                </View>
                <View style={styles.purchaseRow}>
                  <Text style={[styles.purchaseLabel, { color: C.textMuted }]}>Перевозчик</Text>
                  <Text style={[styles.purchaseValue, { color: C.text }]}>АО «СЗППК»</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function TicketCard({ ticket, onDelete, onOpen }: {
  ticket: Ticket;
  onDelete: (id: string) => void;
  onOpen: (ticket: Ticket) => void;
}) {
  const { C } = useTheme();
  const seg = ticket.segment;
  const isPast = new Date(ticket.date) < new Date(new Date().toDateString());
  const pd = getPDNumber(ticket.id);
  const qrData = buildQrData(ticket);
  const category = getTrainCategory(seg);

  const handleDelete = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Удалить билет?", "Это действие нельзя отменить.", [
      { text: "Отмена", style: "cancel" },
      { text: "Удалить", style: "destructive", onPress: () => onDelete(ticket.id) },
    ]);
  };

  const handleOpen = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onOpen(ticket);
  };

  return (
    <Animated.View
      entering={FadeInDown.springify()}
      exiting={FadeOut}
      layout={Layout.springify()}
    >
      <Pressable
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: isPast ? C.surface : C.surface,
            borderColor: isPast ? C.border : C.tint + "35",
            opacity: isPast ? 0.6 : pressed ? 0.93 : 1,
          },
        ]}
        onPress={handleOpen}
        android_ripple={{ color: C.border }}
      >
        <View style={[styles.cardStrip, { backgroundColor: isPast ? C.textMuted : C.tint }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.pdNumber, { color: C.tint }]}>№ПД {pd}</Text>
            <Pressable onPress={handleDelete} hitSlop={8}>
              <Ionicons name="trash-outline" size={16} color={C.red} />
            </Pressable>
          </View>

          <View style={styles.cardRouteRow}>
            <Text style={[styles.cardStation, { color: C.text }]} numberOfLines={1}>
              {seg.from_station.short_title || seg.from_station.title}
            </Text>
            <Ionicons name="arrow-forward" size={12} color={C.tint} style={{ marginHorizontal: 4 }} />
            <Text style={[styles.cardStation, { color: C.text, flex: 1 }]} numberOfLines={1}>
              {seg.to_station.short_title || seg.to_station.title}
            </Text>
          </View>

          <Text style={[styles.cardTicketType, { color: C.textSecondary }]}>
            Разовый билет в одну сторону · {formatDate(ticket.date)}
          </Text>

          <View style={[styles.cardCategoryRow, { backgroundColor: C.surfaceSecondary }]}>
            <Ionicons name="train-outline" size={12} color={C.textMuted} />
            <Text style={[styles.cardCategoryText, { color: C.textMuted }]}>
              Поезда: {category}
              {category === "Стандарт" ? " (обычный пригородный поезд)" : ""}
            </Text>
          </View>

          {!isPast && (
            <View style={[styles.cardQrRow, { borderTopColor: C.border }]}>
              <View style={styles.cardQrWrapper}>
                <QRCode value={qrData} size={90} backgroundColor="#fff" color="#000" />
              </View>
              <View style={styles.cardQrInfo}>
                <Text style={[styles.cardQrRoute, { color: C.text }]}>
                  {formatTime(seg.departure)} → {formatTime(seg.arrival)}
                </Text>
                <Text style={[styles.cardQrDur, { color: C.textMuted }]}>{formatDuration(seg.duration)}</Text>
                <Text style={[styles.cardQrTap, { color: C.tint }]}>Нажмите для просмотра →</Text>
              </View>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function TicketsScreen() {
  const { C } = useTheme();
  const insets = useSafeAreaInsets();
  const { data, isLoading, remove } = useTickets();
  const [openTicket, setOpenTicket] = useState<Ticket | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = (Platform.OS === "web" ? 34 : insets.bottom) + 90;

  const tickets = data?.tickets ?? [];
  const today = new Date(new Date().toDateString());
  const active = useMemo(() => tickets.filter(t => new Date(t.date) >= today), [tickets]);
  const past = useMemo(() => tickets.filter(t => new Date(t.date) < today), [tickets]);

  const listData = useMemo(() => {
    const items: (Ticket | { type: "header"; label: string })[] = [];
    if (active.length > 0) {
      items.push({ type: "header", label: "Предстоящие" });
      items.push(...active);
    }
    if (past.length > 0) {
      items.push({ type: "header", label: "Прошедшие" });
      items.push(...past);
    }
    return items;
  }, [active, past]);

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
            Сохраняйте рейсы из расписания, нажав «Купить»
          </Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item, i) => ("type" in item ? item.label : item.id)}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: bottomPad }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => {
            if ("type" in item) {
              return (
                <Text style={[styles.sectionTitle, { color: C.textMuted }]}>{item.label}</Text>
              );
            }
            return (
              <TicketCard
                ticket={item}
                onDelete={remove}
                onOpen={setOpenTicket}
              />
            );
          }}
        />
      )}

      {openTicket && (
        <TicketDetailModal
          ticket={openTicket}
          onClose={() => setOpenTicket(null)}
          onDelete={remove}
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
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
  },
  cardStrip: { width: 4 },
  cardBody: { flex: 1, paddingVertical: 14, paddingHorizontal: 12 },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  pdNumber: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
  cardRouteRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    flexWrap: "nowrap",
  },
  cardStation: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  cardTicketType: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
  },
  cardCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  cardCategoryText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  cardQrRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingTop: 12,
    marginTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cardQrWrapper: {
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  cardQrInfo: { flex: 1, gap: 3 },
  cardQrRoute: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  cardQrDur: { fontSize: 12, fontFamily: "Inter_400Regular" },
  cardQrTap: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },

  detailContainer: { flex: 1 },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  detailBack: { padding: 8 },
  detailHeaderTitle: { flex: 1, textAlign: "center", fontSize: 17, fontFamily: "Inter_600SemiBold" },
  detailCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#1A6FE8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  detailStrip: { width: 5 },
  detailCardBody: { flex: 1, padding: 16 },
  detailStatusRow: { marginBottom: 12 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  detailRouteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  detailStationName: { flex: 1, fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  detailArrowBlock: { flexDirection: "row", alignItems: "center", gap: 2, width: 50 },
  detailLine: { flex: 1, height: 1 },
  detailMeta: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 14,
  },
  detailDivider: { height: StyleSheet.hairlineWidth, marginVertical: 14 },
  detailTicketType: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  detailDate: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 12 },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    flexWrap: "wrap",
  },
  categoryText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  categoryNote: { fontSize: 12, fontFamily: "Inter_400Regular" },
  qrCenteredBlock: {
    alignItems: "center",
    gap: 10,
    marginVertical: 8,
  },
  qrWhiteBox: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  qrScanHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  scanLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    marginBottom: 4,
  },
  scanSubLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 2,
  },
  purchaseInfoBlock: { gap: 10 },
  purchaseRow: { gap: 2 },
  purchaseLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  purchaseValue: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
