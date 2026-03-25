import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import Colors from "@/constants/colors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "train.side.front.car", selected: "train.side.front.car" }} />
        <Label>Расписание</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="tickets">
        <Icon sf={{ default: "ticket", selected: "ticket.fill" }} />
        <Label>Мои билеты</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="map">
        <Icon sf={{ default: "map", selected: "map.fill" }} />
        <Label>Карта</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Профиль</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const C = isDark ? Colors.dark : Colors.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.tint,
        tabBarInactiveTintColor: C.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : isDark ? "#0A0F1E" : "#FFFFFF",
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: C.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? "#0A0F1E" : "#FFFFFF" }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Расписание",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="train.side.front.car" tintColor={color} size={24} />
            ) : (
              <Ionicons name="train-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: "Мои билеты",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="ticket" tintColor={color} size={24} />
            ) : (
              <Ionicons name="ticket-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Карта",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="map" tintColor={color} size={24} />
            ) : (
              <Ionicons name="map-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Профиль",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person" tintColor={color} size={24} />
            ) : (
              <Ionicons name="person-outline" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (Platform.OS === "ios" && isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
