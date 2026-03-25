import React, { useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Platform,
  Modal,
  ScrollView,
  Dimensions,
  TouchableWithoutFeedback,
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
const QR_DETAIL_SIZE = Math.min(SW - 96, 260);

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
      " в " + d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
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
    hash = (Math.imul(31, hash) + ticketId.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % 900000000 + 100000000).toString();
}

function buildQrData(ticket: Ticket): string {
  const seg = ticket.segment;
  const pd = getPDNumber(ticket.id);
  return `PD:${pd}|FROM:${seg.from_station.title}|TO:${seg.to_station.title}|DEP:${seg.departure}|ARR:${seg.arrival}|TRAIN:${seg.number}|DATE:${ticket.date}`;
}

function getTrainCategory(seg: Ticket["segment"]): string {
  const expr = (seg.thread_express_type || "").toLowerCase();
  const sub = (seg.transport_subtype || "").toLowerCase();
  if (expr.includes("express") || sub.includes("express") || expr.includes("экспресс")) return "Экспресс";
  if (sub.includes("скоростн") || expr.includes("скоростн")) return "Скоростной";
  return "Стандарт";
}

function SpinningQR({ data, size }: { data: string; size: number }) {
  const rotY = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${rotY.value}deg` }],
  }));

  const handleTap = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    rotY.value = withTiming(rotY.value + 360, { duration: 700, easing: Easing.out(Easing.cubic) });
  };

  return (
    <Pressable onPress={handleTap}>
      <Animated.View style={[{ padding: 16, backgroundColor: "#fff", borderRadius: 16 }, animStyle]}>
        <QRCode value={data} size={size} backgroundColor="#fff" color="#000" />
      </Animated.View>
    </Pressable>
  );
}

function ThreeDotsMenu({ onDelete }: { onDelete: () => void }) {
  const { C } = useTheme();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleOpen = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setConfirming(false);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setConfirming(false);
  };

  const handleDeletePress = () => {
    setConfirming(true);
  };

  const handleConfirm = () => {
    setOpen(false);
    setConfirming(false);
    onDelete();
  };

  return (
    <View style={styles.menuContainer}>
      <Pressable style={styles.dotsBtn} onPress={handleOpen} hitSlop={8}>
        <Ionicons name="ellipsis-horizontal" size={20} color={C.textSecondary} />
      </Pressable>

      {open && (
        <>
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <Animated.View
            entering={FadeIn.duration(120)}
            style={[styles.dropdownMenu, { backgroundColor: C.surface, borderColor: C.border, shadowColor: C.text }]}
          >
            {!confirming ? (
              <Pressable
                style={({ pressed }) => [styles.dropdownItem, { opacity: pressed ? 0.6 : 1 }]}
                onPress={handleDeletePress}
              >
                <Ionicons name="trash-outline" size={16} color={C.red} />
                <Text style={[styles.dropdownItemText, { color: C.red }]}>Удалить билет</Text>
              </Pressable>
            ) : (
              <View style={styles.confirmBlock}>
                <Text style={[styles.confirmText, { color: C.text }]}>Удалить билет?</Text>
                <View style={styles.confirmBtns}>
                  <Pressable
                    style={({ pressed }) => [styles.confirmCancel, { borderColor: C.border, opacity: pressed ? 0.6 : 1 }]}
                    onPress={handleClose}
                  >
                    <Text style={[styles.confirmCancelText, { color: C.textSecondary }]}>Отмена</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.confirmDelete, { backgroundColor: C.red, opacity: pressed ? 0.8 : 1 }]}
                    onPress={handleConfirm}
                  >
                    <Text style={styles.confirmDeleteText}>Удалить</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </Animated.View>
        </>
      )}
    </View>
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
    onDelete(ticket.id);
    onClose();
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.detailContainer, { backgroundColor: C.background }]}>
        <View style={[styles.detailHeader, { paddingTop: topPad + 8, backgroundColor: C.surface, borderBottomColor: C.border }]}>
          <Pressable style={styles.headerBtn} onPress={onClose}>
            <Ionicons name="chevron-down" size={24} color={C.tint} />
          </Pressable>
          <Text style={[styles.detailHeaderTitle, { color: C.text }]}>Билет</Text>
          <View style={styles.headerBtn}>
            <ThreeDotsMenu onDelete={handleDelete} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingTop: 20, paddingBottom: bottomPad + 20 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeIn.duration(200)}
            style={[styles.detailCard, { backgroundColor: C.surface, borderColor: C.tint + "40" }]}
          >
            <View style={[styles.detailStrip, { backgroundColor: isPast ? C.textMuted : C.tint }]} />
            <View style={styles.detailCardBody}>
              <View style={[styles.statusPill, { backgroundColor: isPast ? C.surfaceSecondary : C.tint + "18", alignSelf: "flex-start", marginBottom: 14 }]}>
                <Ionicons name={isPast ? "checkmark-circle" : "radio-button-on"} size={11} color={isPast ? C.textMuted : C.tint} />
                <Text style={[styles.statusPillText, { color: isPast ? C.textMuted : C.tint }]}>
                  {isPast ? "Использован" : "Активен"}
                </Text>
              </View>

              <View style={styles.detailRouteRow}>
                <Text style={[styles.detailStation, { color: C.text }]} numberOfLines={2}>
                  {seg.from_station.short_title || seg.from_station.title}
                </Text>
                <View style={styles.detailArrow}>
                  <View style={[styles.arrowLine, { backgroundColor: C.border }]} />
                  <Ionicons name="arrow-forward" size={14} color={C.tint} />
                  <View style={[styles.arrowLine, { backgroundColor: C.border }]} />
                </View>
                <Text style={[styles.detailStation, { color: C.text, textAlign: "right" }]} numberOfLines={2}>
                  {seg.to_station.short_title || seg.to_station.title}
                </Text>
              </View>

              <Text style={[styles.detailTimeMeta, { color: C.textSecondary }]}>
                {formatTime(seg.departure)} → {formatTime(seg.arrival)} · {formatDuration(seg.duration)}
              </Text>

              <View style={[styles.divider, { backgroundColor: C.border }]} />

              <Text style={[styles.ticketTypeLabel, { color: C.text }]}>Разовый билет в одну сторону</Text>
              <Text style={[styles.ticketDateText, { color: C.textSecondary }]}>{formatDate(ticket.date)}</Text>

              <View style={[styles.categoryBadge, { backgroundColor: C.surfaceSecondary, borderColor: C.border }]}>
                <Ionicons name="train-outline" size={13} color={C.textSecondary} />
                <Text style={[styles.categoryText, { color: C.textSecondary }]}>
                  Билет подходит для поездов категории {category}
                  {category === "Стандарт" ? " (обычный пригородный поезд)" : ""}
                </Text>
              </View>

              {!isPast && (
                <>
                  <View style={[styles.divider, { backgroundColor: C.border }]} />
                  <View style={styles.qrBlock}>
                    <SpinningQR data={qrData} size={QR_DETAIL_SIZE} />
                    <Text style={[styles.qrHint, { color: C.textMuted }]}>
                      Нажмите на QR-код, чтобы прокрутить
                    </Text>
                  </View>
                  <Text style={[styles.scanText, { color: C.textSecondary }]}>
                    Просканируйте этот штрихкод на турникете.
                  </Text>
                  <Text style={[styles.scanSubText, { color: C.textMuted }]}>
                    Если возникли проблемы, обратитесь к работникам станции.
                  </Text>
                </>
              )}

              <View style={[styles.divider, { backgroundColor: C.border }]} />

              <View style={styles.infoRows}>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: C.textMuted }]}>Приобретён</Text>
                  <Text style={[styles.infoValue, { color: C.text }]}>{formatDatetime(ticket.saved_at)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: C.textMuted }]}>№ПД</Text>
                  <Text style={[styles.infoValue, { color: C.text, fontFamily: "Inter_600SemiBold" }]}>{pd}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: C.textMuted }]}>Перевозчик</Text>
                  <Text style={[styles.infoValue, { color: C.text }]}>АО «СЗППК»</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function TicketCard({ ticket, onOpen }: { ticket: Ticket; onOpen: (ticket: Ticket) => void }) {
  const { C } = useTheme();
  const seg = ticket.segment;
  const isPast = new Date(ticket.date) < new Date(new Date().toDateString());
  const pd = getPDNumber(ticket.id);
  const qrData = buildQrData(ticket);
  const category = getTrainCategory(seg);

  return (
    <Animated.View entering={FadeInDown.springify()} exiting={FadeOut} layout={Layout.springify()}>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: C.surface,
            borderColor: isPast ? C.border : C.tint + "30",
            opacity: isPast ? 0.6 : pressed ? 0.92 : 1,
          },
        ]}
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onOpen(ticket);
        }}
      >
        <View style={[styles.cardStrip, { backgroundColor: isPast ? C.textMuted : C.tint }]} />
        <View style={styles.cardBody}>
          <Text style={[styles.pdText, { color: C.tint }]}>№ПД {pd}</Text>

          <View style={styles.routeRow}>
            <Text style={[styles.routeStation, { color: C.text }]} numberOfLines={1}>
              {seg.from_station.short_title || seg.from_station.title}
            </Text>
            <Ionicons name="arrow-forward" size={13} color={C.tint} style={{ marginHorizontal: 6 }} />
            <Text style={[styles.routeStation, { color: C.text, flex: 1 }]} numberOfLines={1}>
              {seg.to_station.short_title || seg.to_station.title}
            </Text>
          </View>

          <Text style={[styles.cardTicketType, { color: C.textSecondary }]}>
            Разовый билет в одну сторону · {formatDate(ticket.date)}
          </Text>

          <View style={[styles.cardCategoryRow, { backgroundColor: C.surfaceSecondary }]}>
            <Ionicons name="train-outline" size={11} color={C.textMuted} />
            <Text style={[styles.cardCategoryText, { color: C.textMuted }]}>
              Поезда: {category}{category === "Стандарт" ? " (обычный пригородный поезд)" : ""}
            </Text>
          </View>

          {!isPast && (
            <View style={[styles.cardQrRow, { borderTopColor: C.border }]}>
              <View style={{ padding: 8, backgroundColor: "#fff", borderRadius: 8 }}>
                <QRCode value={qrData} size={80} backgroundColor="#fff" color="#000" />
              </View>
              <View style={styles.cardQrRight}>
                <Text style={[styles.cardQrTime, { color: C.text }]}>
                  {formatTime(seg.departure)} → {formatTime(seg.arrival)}
                </Text>
                <Text style={[styles.cardQrDur, { color: C.textMuted }]}>{formatDuration(seg.duration)}</Text>
                <View style={styles.cardQrOpenRow}>
                  <Text style={[styles.cardQrOpen, { color: C.tint }]}>Открыть билет</Text>
                  <Ionicons name="chevron-forward" size={12} color={C.tint} />
                </View>
              </View>
            </View>
          )}

          {isPast && (
            <View style={[styles.pastBadge, { borderTopColor: C.border }]}>
              <Ionicons name="checkmark-circle-outline" size={13} color={C.textMuted} />
              <Text style={[styles.pastBadgeText, { color: C.textMuted }]}>Билет использован</Text>
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
    const items: (Ticket | { _header: string })[] = [];
    if (active.length > 0) {
      items.push({ _header: "Предстоящие" });
      items.push(...active);
    }
    if (past.length > 0) {
      items.push({ _header: "Прошедшие" });
      items.push(...past);
    }
    return items;
  }, [active, past]);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <Text style={[styles.headerTitle, { color: C.text }]}>Мои билеты</Text>
        <Text style={[styles.headerSub, { color: C.textMuted }]}>
          {tickets.length > 0
            ? `${tickets.length} ${tickets.length === 1 ? "билет" : tickets.length < 5 ? "билета" : "билетов"}`
            : "Нет сохранённых билетов"}
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
            Оформите рейс из расписания, нажав «Купить»
          </Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item, i) => ("_header" in item ? item._header : item.id)}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: bottomPad }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => {
            if ("_header" in item) {
              return (
                <Text style={[styles.sectionTitle, { color: C.textMuted }]}>{item._header}</Text>
              );
            }
            return <TicketCard ticket={item} onOpen={setOpenTicket} />;
          }}
        />
      )}

      {openTicket && (
        <TicketDetailModal
          ticket={openTicket}
          onClose={() => setOpenTicket(null)}
          onDelete={(id) => {
            remove(id);
            setOpenTicket(null);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { borderBottomWidth: 1, paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold", marginTop: 8 },
  headerSub: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 2 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  sectionTitle: {
    fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.6,
    textTransform: "uppercase", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6,
  },
  card: { marginHorizontal: 16, borderRadius: 16, borderWidth: 1, flexDirection: "row", overflow: "hidden" },
  cardStrip: { width: 4 },
  cardBody: { flex: 1, paddingVertical: 14, paddingHorizontal: 12 },
  pdText: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.3, marginBottom: 6 },
  routeRow: { flexDirection: "row", alignItems: "center", marginBottom: 4, flexWrap: "nowrap" },
  routeStation: { fontSize: 17, fontFamily: "Inter_700Bold", letterSpacing: -0.3, flexShrink: 1 },
  cardTicketType: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 8 },
  cardCategoryRow: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 7, paddingVertical: 4, borderRadius: 7, alignSelf: "flex-start",
  },
  cardCategoryText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  cardQrRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingTop: 12, marginTop: 10, borderTopWidth: StyleSheet.hairlineWidth,
  },
  cardQrRight: { flex: 1, gap: 3 },
  cardQrTime: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cardQrDur: { fontSize: 12, fontFamily: "Inter_400Regular" },
  cardQrOpenRow: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 4 },
  cardQrOpen: { fontSize: 12, fontFamily: "Inter_500Medium" },
  pastBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingTop: 10, marginTop: 10, borderTopWidth: StyleSheet.hairlineWidth,
  },
  pastBadgeText: { fontSize: 12, fontFamily: "Inter_400Regular" },

  detailContainer: { flex: 1 },
  detailHeader: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 8, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { width: 40, alignItems: "center", justifyContent: "center", padding: 8 },
  detailHeaderTitle: { flex: 1, textAlign: "center", fontSize: 17, fontFamily: "Inter_600SemiBold" },
  menuContainer: { position: "relative" },
  dotsBtn: { padding: 4 },
  dropdownMenu: {
    position: "absolute",
    top: 36,
    right: 0,
    minWidth: 180,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  dropdownItemText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  confirmBlock: { padding: 14, gap: 12 },
  confirmText: { fontSize: 14, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  confirmBtns: { flexDirection: "row", gap: 8 },
  confirmCancel: {
    flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1,
    alignItems: "center",
  },
  confirmCancelText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  confirmDelete: {
    flex: 1, paddingVertical: 9, borderRadius: 10,
    alignItems: "center",
  },
  confirmDeleteText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  detailCard: {
    marginHorizontal: 16, borderRadius: 20, borderWidth: 1.5,
    flexDirection: "row", overflow: "hidden",
    shadowColor: "#1A6FE8", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 6,
  },
  detailStrip: { width: 5 },
  detailCardBody: { flex: 1, padding: 16 },
  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  statusPillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  detailRouteRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  detailStation: { flex: 1, fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  detailArrow: { flexDirection: "row", alignItems: "center", gap: 2, width: 44 },
  arrowLine: { flex: 1, height: 1 },
  detailTimeMeta: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 14 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 14 },
  ticketTypeLabel: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  ticketDateText: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 12 },
  categoryBadge: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  categoryText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
  qrBlock: { alignItems: "center", gap: 10, marginVertical: 6 },
  qrHint: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
  scanText: { fontSize: 14, fontFamily: "Inter_500Medium", textAlign: "center", marginBottom: 4 },
  scanSubText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19, marginBottom: 2 },
  infoRows: { gap: 10 },
  infoRow: { gap: 2 },
  infoLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
