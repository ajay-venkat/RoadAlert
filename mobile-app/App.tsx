import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import NavigationScreen from "./src/screens/NavigationScreen";
import ReportScreen from "./src/screens/ReportScreen";
import ConfirmationScreen from "./src/screens/ConfirmationScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1C1E22' }
        }}
      >
        <Stack.Screen name="Navigation" component={NavigationScreen} />
        <Stack.Screen name="Capture" component={ReportScreen} />
        <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

