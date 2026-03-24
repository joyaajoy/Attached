import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  Switch,
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

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h} ч ${m} мин` : `${m} мин`;
}

type Option = { id: string; label: string; desc: string; icon: string; price: number };

const EXTRAS: Option[] = [
  { id: "luggage", label: "Ручная кладь", desc: "До 36 кг, 3 места", icon: "briefcase-outline", price: 0 },
  { id: "bike", label: "Велосипед", desc: "Крупногабаритный предмет", icon: "bicycle-outline", price: 120 },
  { id: "pet", label: "Домашнее животное", desc: "Мелкие в переноске", icon: "paw-outline", price: 80 },
  { id: "insurance", label: "Страхование", desc: "Защита на время поездки", icon: "shield-checkmark-outline", price: 59 },
];

const TICKET_TYPES = [
  { id: "full", label: "Полный", price: 0 },
  { id: "child", label: "Детский", price: -50 },
  { id: "student", label: "Студенческий", price: -30 },
];

export default function BuyScreen() {
  const { C } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const segment: TrainSegment | null = params.data ? JSON.parse(params.data as string) : null;
  const date = (params.date as string) || new Date().toISOString().split("T")[0];

  const { data: ticketsData, save, isSaving } = useTickets();
  const isSaved = ticketsData?.tickets?.some(t => t.segment.uid === segment?.uid) ?? false;

  const [selectedType, setSelectedType] = useState("full");
  const [enabledExtras, setEnabledExtras] = useState<Set<string>>(new Set(["luggage"]));

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = (Platform.OS === "web" ? 34 : insets.bottom) + 16;

  if (!segment) {
    return (
      <View style={[styles.container, { backgroundColor: C.background }]}>
        <Text style={[styles.error, { color: C.textMuted }]}>Рейс не найден</Text>
      </View>
    );
  }

  const basePrice = segment.price_min ?? 0;
  const typeDiscount = TICKET_TYPES.find(t => t.id === selectedType)?.price ?? 0;
  const extrasTotal = EXTRAS.filter(e => enabledExtras.has(e.id)).reduce((sum, e) => sum + e.price, 0);
  const totalPrice = Math.max(0, basePrice + typeDiscount + extrasTotal);

  const toggleExtra = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEnabledExtras(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBuy = async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      if (!isSaved) await save(segment, date);
      Alert.alert(
        "Билет оформлен!",
        `Маршрут сохранён в «Мои билеты». Стоимость: ${totalPrice > 0 ? totalPrice + " ₽" : "бесплатно"}.`,
        [{ text: "Отлично", onPress: () => router.back() }]
      );
    } catch {
      Alert.alert("Ошибка", "Не удалось сохранить билет");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={C.tint} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: C.text }]}>Оформление билета</Text>
          <Text style={[styles.headerSub, { color: C.textMuted }]}>{formatDate(date)}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: bottomPad + 90 }}>
        <View style={[styles.routeCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={styles.routeRow}>
            <View style={styles.stationBlock}>
              <Text style={[styles.bigTime, { color: C.text }]}>{formatTime(segment.departure)}</Text>
              <Text style={[styles.stationName, { color: C.textSecondary }]} numberOfLines={2}>
                {segment.from_station.title}
              </Text>
            </View>
            <View style={styles.middleBlock}>
              <Ionicons name="train" size={20} color={C.tint} />
              <Text style={[styles.durText, { color: C.textMuted }]}>{formatDuration(segment.duration)}</Text>
            </View>
            <View style={[styles.stationBlock, { alignItems: "flex-end" }]}>
              <Text style={[styles.bigTime, { color: C.text }]}>{formatTime(segment.arrival)}</Text>
              <Text style={[styles.stationName, { color: C.textSecondary, textAlign: "right" }]} numberOfLines={2}>
                {segment.to_station.title}
              </Text>
            </View>
          </View>
          <View style={[styles.trainRow, { borderTopColor: C.border }]}>
            <Ionicons name="information-circle-outline" size={14} color={C.textMuted} />
            <Text style={[styles.trainNum, { color: C.textMuted }]}>Рейс №{segment.number} · {segment.title}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: C.textMuted }]}>Тип билета</Text>
        <View style={[styles.segmentedCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          {TICKET_TYPES.map((t, i) => (
            <Pressable
              key={t.id}
              style={[
                styles.typeBtn,
                i < TICKET_TYPES.length - 1 && { borderRightColor: C.border, borderRightWidth: 1 },
                selectedType === t.id && { backgroundColor: C.tint + "18" },
              ]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync();
                setSelectedType(t.id);
              }}
            >
              <Text style={[styles.typeLabel, { color: selectedType === t.id ? C.tint : C.text }]}>{t.label}</Text>
              {t.price !== 0 && (
                <Text style={[styles.typePrice, { color: selectedType === t.id ? C.tint : C.textMuted }]}>
                  {t.price > 0 ? `+${t.price} ₽` : `${t.price} ₽`}
                </Text>
              )}
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: C.textMuted }]}>Дополнительно</Text>
        <View style={[styles.extrasCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          {EXTRAS.map((extra, i) => (
            <View
              key={extra.id}
              style={[
                styles.extraRow,
                i > 0 && { borderTopWidth: 1, borderTopColor: C.border },
              ]}
            >
              <View style={[styles.extraIcon, { backgroundColor: C.tint + "18" }]}>
                <Ionicons name={extra.icon as any} size={18} color={C.tint} />
              </View>
              <View style={styles.extraInfo}>
                <Text style={[styles.extraLabel, { color: C.text }]}>{extra.label}</Text>
                <Text style={[styles.extraDesc, { color: C.textMuted }]}>
                  {extra.desc}{extra.price > 0 ? ` · +${extra.price} ₽` : " · Включена"}
                </Text>
              </View>
              <Switch
                value={enabledExtras.has(extra.id)}
                onValueChange={() => toggleExtra(extra.id)}
                trackColor={{ false: C.border, true: C.tint + "66" }}
                thumbColor={enabledExtras.has(extra.id) ? C.tint : C.surfaceSecondary}
                ios_backgroundColor={C.border}
              />
            </View>
          ))}
        </View>

        <View style={[styles.totalCard, { backgroundColor: C.tint + "12", borderColor: C.tint + "30" }]}>
          <Text style={[styles.totalLabel, { color: C.textSecondary }]}>Итого к оплате</Text>
          <Text style={[styles.totalPrice, { color: C.tint }]}>
            {totalPrice > 0 ? `${totalPrice} ₽` : "Бесплатно"}
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad, backgroundColor: C.surface, borderTopColor: C.border }]}>
        <Pressable
          style={({ pressed }) => [
            styles.buyBtn,
            { backgroundColor: isSaved ? C.green : C.tint, opacity: pressed ? 0.88 : 1 },
          ]}
          onPress={handleBuy}
          disabled={isSaving}
        >
          <Ionicons name={isSaved ? "checkmark-circle" : "card-outline"} size={20} color="#fff" />
          <Text style={styles.buyBtnText}>
            {isSaved ? "Уже в билетах" : totalPrice > 0 ? `Оформить · ${totalPrice} ₽` : "Оформить бесплатно"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  error: { fontSize: 16, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 4,
  },
  backBtn: { padding: 8 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  routeCard: {
    margin: 16,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 8,
  },
  stationBlock: { flex: 1, gap: 4 },
  bigTime: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  stationName: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  middleBlock: { alignItems: "center", gap: 4, width: 70 },
  durText: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
  trainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  trainNum: { fontSize: 12, fontFamily: "Inter_400Regular" },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    paddingBottom: 8,
    marginTop: 4,
  },
  segmentedCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    gap: 2,
  },
  typeLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  typePrice: { fontSize: 11, fontFamily: "Inter_400Regular" },
  extrasCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 16,
  },
  extraRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  extraIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  extraInfo: { flex: 1 },
  extraLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  extraDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  totalCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalLabel: { fontSize: 15, fontFamily: "Inter_400Regular" },
  totalPrice: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
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
});
