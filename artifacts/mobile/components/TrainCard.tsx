import React from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import type { TrainSegment } from "@workspace/api-client-react";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  segment: TrainSegment;
  onPress?: (segment: TrainSegment) => void;
  onSave?: (segment: TrainSegment) => void;
  isSaved?: boolean;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso.slice(11, 16);
  }
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} ч ${m} мин`;
  return `${m} мин`;
}

function formatPrice(min: number | null | undefined, max: number | null | undefined): string {
  if (!min) return "Цена неизвестна";
  if (max && max !== min) return `${min}–${max} ₽`;
  return `${min} ₽`;
}

function getTrainTypeLabel(seg: TrainSegment): { label: string; color: string } {
  const type = seg.thread_express_type || seg.transport_subtype || "";
  if (type.toLowerCase().includes("express") || type.toLowerCase().includes("экспресс")) {
    return { label: "Экспресс", color: "#F97316" };
  }
  if (type.toLowerCase().includes("скоростн")) {
    return { label: "Скоростной", color: "#8B5CF6" };
  }
  return { label: "Электричка", color: "#1A6FE8" };
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function TrainCard({ segment, onPress, onSave, isSaved }: Props) {
  const { C } = useTheme();
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const { label, color } = getTrainTypeLabel(segment);

  const handlePress = () => {
    scale.value = withSpring(0.97, { duration: 100 }, () => {
      scale.value = withSpring(1);
    });
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(segment);
  };

  const handleSave = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave?.(segment);
  };

  const dep = formatTime(segment.departure);
  const arr = formatTime(segment.arrival);
  const dur = formatDuration(segment.duration);
  const price = formatPrice(segment.price_min, segment.price_max);

  return (
    <AnimatedPressable style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }, anim]} onPress={handlePress}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: color + "18" }]}>
          <Text style={[styles.badgeText, { color }]}>{label}</Text>
        </View>
        <Text style={[styles.trainNumber, { color: C.textMuted }]}>№{segment.number}</Text>
        <Pressable style={styles.saveBtn} onPress={handleSave} hitSlop={8}>
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={20}
            color={isSaved ? C.tint : C.textMuted}
          />
        </Pressable>
      </View>

      <View style={styles.timeRow}>
        <View style={styles.timeBlock}>
          <Text style={[styles.time, { color: C.text }]}>{dep}</Text>
          <Text style={[styles.station, { color: C.textSecondary }]} numberOfLines={1}>
            {segment.from_station.short_title || segment.from_station.title}
          </Text>
        </View>

        <View style={styles.durationBlock}>
          <Text style={[styles.duration, { color: C.textMuted }]}>{dur}</Text>
          <View style={styles.durationLine}>
            <View style={[styles.dot, { backgroundColor: C.tint }]} />
            <View style={[styles.line, { backgroundColor: C.border }]} />
            <Ionicons name="train-outline" size={14} color={C.tint} />
            <View style={[styles.line, { backgroundColor: C.border }]} />
            <View style={[styles.dot, { backgroundColor: C.tint }]} />
          </View>
        </View>

        <View style={[styles.timeBlock, styles.timeRight]}>
          <Text style={[styles.time, { color: C.text }]}>{arr}</Text>
          <Text style={[styles.station, { color: C.textSecondary }]} numberOfLines={1}>
            {segment.to_station.short_title || segment.to_station.title}
          </Text>
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: C.border }]}>
        <View style={styles.footerLeft}>
          <Ionicons name="pricetag-outline" size={13} color={C.textMuted} />
          <Text style={[styles.price, { color: C.tint }]}>{price}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Pressable
          style={[styles.buyBtn, { backgroundColor: C.tint }]}
          onPress={handlePress}
          hitSlop={4}
        >
          <Text style={styles.buyBtnText}>Купить</Text>
        </Pressable>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 10,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
  trainNumber: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  saveBtn: {
    padding: 4,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 8,
  },
  timeBlock: {
    minWidth: 80,
  },
  timeRight: {
    alignItems: "flex-end",
  },
  time: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  station: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  durationBlock: {
    flex: 1,
    alignItems: "center",
  },
  duration: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  durationLine: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  line: {
    flex: 1,
    height: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  price: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  stops: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  buyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  buyBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
