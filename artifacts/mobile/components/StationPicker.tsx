import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Station } from "@workspace/api-client-react";
import { useTheme } from "@/hooks/useTheme";
import { useStationSearch, usePopularStations } from "@/hooks/useSchedule";

interface Props {
  onSelect: (station: Station) => void;
  onClose: () => void;
  placeholder: string;
}

export function StationPicker({ onSelect, onClose, placeholder }: Props) {
  const { C, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const inputRef = useRef<TextInput>(null);

  const { data: searchData, isLoading: isSearching } = useStationSearch(query);
  const { data: popularData } = usePopularStations();

  const stations = query.length >= 2
    ? (searchData?.stations ?? [])
    : (popularData?.stations ?? []);

  const isLoading = query.length >= 2 && isSearching;

  const handleSelect = (s: Station) => {
    onSelect(s);
    onClose();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: C.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: C.border }]}>
        <View style={[styles.searchBar, { backgroundColor: C.surfaceSecondary, borderColor: C.border }]}>
          <Ionicons name="search-outline" size={18} color={C.textMuted} />
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: C.text, fontFamily: "Inter_400Regular" }]}
            placeholder={placeholder}
            placeholderTextColor={C.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={C.textMuted} />
            </Pressable>
          )}
        </View>
        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={[styles.closeText, { color: C.tint }]}>Отмена</Text>
        </Pressable>
      </View>

      {!query && (
        <Text style={[styles.sectionTitle, { color: C.textMuted }]}>Популярные станции</Text>
      )}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={C.tint} />
        </View>
      ) : (
        <FlatList
          data={stations}
          keyExtractor={(item) => item.code || item.title}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.stationRow,
                { borderBottomColor: C.border },
                pressed && { backgroundColor: C.surfaceSecondary },
              ]}
              onPress={() => handleSelect(item)}
            >
              <View style={[styles.stationIcon, { backgroundColor: C.surfaceSecondary }]}>
                <Ionicons name="train-outline" size={16} color={C.tint} />
              </View>
              <View style={styles.stationInfo}>
                <Text style={[styles.stationName, { color: C.text }]}>{item.title}</Text>
                {item.popular_title ? (
                  <Text style={[styles.stationRegion, { color: C.textMuted }]}>
                    {item.popular_title}{item.region ? `, ${item.region}` : ""}
                  </Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="search-outline" size={40} color={C.textMuted} />
              <Text style={[styles.emptyText, { color: C.textMuted }]}>
                {query.length >= 2 ? "Станций не найдено" : "Введите название станции"}
              </Text>
            </View>
          }
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  closeBtn: {
    paddingVertical: 4,
  },
  closeText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
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
  stationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  stationIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  stationInfo: {
    flex: 1,
    gap: 2,
  },
  stationName: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  stationRegion: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
