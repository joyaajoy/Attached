import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  Pressable,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";

const STATIONS = [
  { code: "s9600213", title: "Москва Курская", lat: 55.7539, lng: 37.6586 },
  { code: "s9601660", title: "Москва Ярославская", lat: 55.7765, lng: 37.6568 },
  { code: "s9602497", title: "Москва Казанская", lat: 55.7751, lng: 37.6561 },
  { code: "s9602494", title: "Москва Павелецкая", lat: 55.7295, lng: 37.6449 },
  { code: "s9601728", title: "Москва Белорусская", lat: 55.7763, lng: 37.5815 },
  { code: "s9600721", title: "Москва Рижская", lat: 55.7886, lng: 37.6124 },
  { code: "s2000006", title: "СПб Финляндский", lat: 59.9547, lng: 30.3551 },
  { code: "s9603060", title: "Мытищи", lat: 55.9121, lng: 37.7307 },
  { code: "s9600372", title: "Электроугли", lat: 55.717, lng: 38.228 },
  { code: "s9600721", title: "Пушкино", lat: 56.009, lng: 37.8458 },
  { code: "s2000006", title: "СПб Витебский", lat: 59.9191, lng: 30.3241 },
  { code: "s9603789", title: "Одинцово", lat: 55.6768, lng: 37.2723 },
  { code: "s9600372", title: "Люберцы", lat: 55.6788, lng: 37.8617 },
  { code: "s9602497", title: "Химки", lat: 55.889, lng: 37.427 },
];

export default function MapScreen() {
  const { C } = useTheme();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = (Platform.OS === "web" ? 34 : insets.bottom) + 90;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <Text style={[styles.headerTitle, { color: C.text }]}>Карта</Text>
        <Text style={[styles.headerSub, { color: C.textMuted }]}>Станции электричек</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomPad }}>
        <View style={[styles.infoCard, { backgroundColor: C.surfaceSecondary, borderColor: C.border }]}>
          <Ionicons name="map-outline" size={36} color={C.tint} />
          <View style={styles.infoText}>
            <Text style={[styles.infoTitle, { color: C.text }]}>Интерактивная карта</Text>
            <Text style={[styles.infoDesc, { color: C.textMuted }]}>
              В Expo Go откройте приложение на устройстве для просмотра станций на карте
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: C.textMuted }]}>Основные станции</Text>

        {STATIONS.map((s) => (
          <Pressable
            key={s.code + s.lat}
            style={({ pressed }) => [
              styles.stationRow,
              {
                backgroundColor: pressed ? C.surfaceSecondary : C.surface,
                borderColor: C.border,
              },
            ]}
            onPress={() => Linking.openURL(`https://yandex.ru/maps/?pt=${s.lng},${s.lat}&z=15&l=map`)}
          >
            <View style={[styles.stationIconWrap, { backgroundColor: C.tint + "18" }]}>
              <Ionicons name="train-outline" size={18} color={C.tint} />
            </View>
            <View style={styles.stationInfo}>
              <Text style={[styles.stationName, { color: C.text }]}>{s.title}</Text>
              <Text style={[styles.coords, { color: C.textMuted }]}>
                {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
              </Text>
            </View>
            <Ionicons name="open-outline" size={16} color={C.textMuted} />
          </Pressable>
        ))}
      </ScrollView>
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
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    marginBottom: 24,
  },
  infoText: { flex: 1, gap: 4 },
  infoTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  infoDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  stationRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 12,
    marginBottom: 8,
  },
  stationIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  stationInfo: { flex: 1, gap: 2 },
  stationName: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  coords: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
