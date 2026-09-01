// Copy this content into mobile-app/App.tsx
import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import NavigationScreen from "./src/screens/NavigationScreen";
import ReportScreen from "./src/screens/ReportScreen";
import ConfirmationScreen from "./src/screens/ConfirmationScreen";

// If you don't have @react-navigation/stack installed, run:
// npm install @react-navigation/stack @react-native-masked-view/masked-view react-native-gesture-handler

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#1C1E22' },
        }}
      >
        <Stack.Screen name="Navigation" component={NavigationScreen} />
        <Stack.Screen name="Capture" component={ReportScreen} />
        <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
