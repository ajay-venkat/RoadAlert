/**
 * RoadWatch AI — Mobile App Entry Point
 * Tab-based navigation: Capture | History | Settings
 */

import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View } from "react-native";

import CaptureScreen from "./screens/CaptureScreen";
import HistoryScreen from "./screens/HistoryScreen";
import SettingsScreen from "./screens/SettingsScreen";

const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Capture: "📷",
    History: "📋",
    Settings: "⚙️",
  };
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 20 }}>{icons[label] || "•"}</Text>
      <Text
        style={{
          fontSize: 10,
          fontWeight: focused ? "700" : "400",
          color: focused ? "#a5b4fc" : "#64748b",
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: "#0c1222",
            borderTopColor: "rgba(99, 102, 241, 0.12)",
            borderTopWidth: 1,
            height: 70,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarIcon: ({ focused }) => (
            <TabIcon label={route.name} focused={focused} />
          ),
        })}
      >
        <Tab.Screen name="Capture" component={CaptureScreen} />
        <Tab.Screen name="History" component={HistoryScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
