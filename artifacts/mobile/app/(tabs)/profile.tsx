import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/hooks/useTheme";
import { useTickets } from "@/hooks/useTickets";

interface MenuItemProps {
  icon: string;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  value?: string;
  color?: string;
}

function MenuItem({ icon, label, sublabel, onPress, value, color }: MenuItemProps) {
  const { C } = useTheme();
  const iconColor = color || C.tint;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        { borderBottomColor: C.border },
        pressed && { backgroundColor: C.surfaceSecondary },
      ]}
      onPress={() => {
        if (Platform.OS !== "web") Haptics.selectionAsync();
        onPress?.();
      }}
    >
      <View style={[styles.menuIcon, { backgroundColor: iconColor + "18" }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuLabel, { color: C.text }]}>{label}</Text>
        {sublabel && <Text style={[styles.menuSublabel, { color: C.textMuted }]}>{sublabel}</Text>}
      </View>
      {value ? (
        <Text style={[styles.menuValue, { color: C.textMuted }]}>{value}</Text>
      ) : (
        <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
      )}
    </Pressable>
  );
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  const { C } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: C.textMuted }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: C.surface, borderColor: C.border }]}>
        {children}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { C } = useTheme();
  const insets = useSafeAreaInsets();
  const { data } = useTickets();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = (Platform.OS === "web" ? 34 : insets.bottom) + 90;
  const ticketCount = data?.tickets?.length ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <Text style={[styles.headerTitle, { color: C.text }]}>Профиль</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: bottomPad }}>
        <View style={[styles.profileCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={[styles.avatar, { backgroundColor: C.tint }]}>
            <Ionicons name="person" size={36} color="#fff" />
          </View>
          <Text style={[styles.profileName, { color: C.text }]}>Путешественник</Text>
          <Text style={[styles.profileSub, { color: C.textMuted }]}>Электрички России</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: C.text }]}>{ticketCount}</Text>
              <Text style={[styles.statLabel, { color: C.textMuted }]}>Билетов</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: C.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: C.text }]}>85+</Text>
              <Text style={[styles.statLabel, { color: C.textMuted }]}>Регионов</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: C.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: C.text }]}>~10 000</Text>
              <Text style={[styles.statLabel, { color: C.textMuted }]}>Станций</Text>
            </View>
          </View>
        </View>

        <MenuSection title="Приложение">
          <MenuItem
            icon="train-outline"
            label="API Яндекс.Расписаний"
            sublabel="Данные о маршрутах в реальном времени"
            value="Подключён"
          />
          <MenuItem
            icon="map-outline"
            label="Яндекс Карты"
            sublabel="Отображение станций"
            value="Активны"
          />
          <MenuItem
            icon="refresh-outline"
            label="Обновление данных"
            sublabel="Расписание обновляется в реальном времени"
          />
        </MenuSection>

        <MenuSection title="Информация">
          <MenuItem
            icon="information-circle-outline"
            label="О приложении"
            sublabel="Версия 1.0.0"
          />
          <MenuItem
            icon="shield-checkmark-outline"
            label="Источник данных"
            sublabel="Яндекс.Расписания"
            onPress={() => Linking.openURL("https://rasp.yandex.ru/")}
          />
          <MenuItem
            icon="globe-outline"
            label="Яндекс.Расписания"
            onPress={() => Linking.openURL("https://rasp.yandex.ru/")}
          />
        </MenuSection>

        <MenuSection title="Охват">
          <MenuItem
            icon="location-outline"
            label="Москва и область"
            sublabel="Все направления МЦД, Центральная Россия"
          />
          <MenuItem
            icon="location-outline"
            label="Санкт-Петербург"
            sublabel="Все пригородные направления"
          />
          <MenuItem
            icon="location-outline"
            label="Другие регионы"
            sublabel="Урал, Сибирь, Дальний Восток и другие"
          />
        </MenuSection>

        <Text style={[styles.footer, { color: C.textMuted }]}>
          Данные предоставлены Яндекс.Расписаниями{"\n"}Электрички России © 2024
        </Text>
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
  profileCard: {
    margin: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 6,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  profileName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  profileSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    width: "100%",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  statDivider: {
    width: 1,
    height: 36,
  },
  section: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuContent: { flex: 1, gap: 2 },
  menuLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  menuSublabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  menuValue: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 32,
    paddingVertical: 24,
    lineHeight: 18,
  },
});
