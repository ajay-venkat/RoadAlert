/**
 * RoadWatch AI — Settings Screen
 * Configuration for backend API URL, capture interval, and confidence threshold.
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import Slider from "@react-native-community/slider";
import { getApiBase, setApiBase, checkHealth } from "../services/api";

export default function SettingsScreen() {
  const [apiUrl, setApiUrl] = useState(getApiBase());
  const [captureInterval, setCaptureInterval] = useState(3);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.25);
  const [connectionStatus, setConnectionStatus] = useState<
    "unknown" | "connected" | "disconnected"
  >("unknown");

  // Test connection
  const testConnection = async () => {
    setConnectionStatus("unknown");
    setApiBase(apiUrl);
    const ok = await checkHealth();
    setConnectionStatus(ok ? "connected" : "disconnected");

    if (ok) {
      Alert.alert("✅ Connected", `Successfully connected to ${apiUrl}`);
    } else {
      Alert.alert(
        "❌ Connection Failed",
        `Could not reach ${apiUrl}. Check the URL and make sure the backend is running.`
      );
    }
  };

  const saveSettings = () => {
    setApiBase(apiUrl);
    Alert.alert("✅ Saved", "Settings have been updated.");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Configure RoadWatch AI</Text>
      </View>

      <View style={styles.content}>
        {/* API URL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BACKEND API</Text>
          <TextInput
            style={styles.input}
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="http://192.168.1.100:8000"
            placeholderTextColor="#64748b"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.connectionRow}>
            <TouchableOpacity style={styles.testBtn} onPress={testConnection}>
              <Text style={styles.testBtnText}>Test Connection</Text>
            </TouchableOpacity>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    connectionStatus === "connected"
                      ? "#22c55e"
                      : connectionStatus === "disconnected"
                      ? "#ef4444"
                      : "#64748b",
                },
              ]}
            />
            <Text style={styles.statusLabel}>
              {connectionStatus === "connected"
                ? "Connected"
                : connectionStatus === "disconnected"
                ? "Disconnected"
                : "Not tested"}
            </Text>
          </View>
        </View>

        {/* Capture Interval */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CAPTURE INTERVAL</Text>
          <Text style={styles.sliderValue}>{captureInterval}s between captures</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={captureInterval}
            onValueChange={setCaptureInterval}
            minimumTrackTintColor="#6366f1"
            maximumTrackTintColor="#1e293b"
            thumbTintColor="#818cf8"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>1s (fast)</Text>
            <Text style={styles.sliderLabel}>10s (slow)</Text>
          </View>
        </View>

        {/* Confidence Threshold */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONFIDENCE THRESHOLD</Text>
          <Text style={styles.sliderValue}>
            {(confidenceThreshold * 100).toFixed(0)}% minimum confidence
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0.1}
            maximumValue={0.9}
            step={0.05}
            value={confidenceThreshold}
            onValueChange={setConfidenceThreshold}
            minimumTrackTintColor="#06b6d4"
            maximumTrackTintColor="#1e293b"
            thumbTintColor="#22d3ee"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>10% (sensitive)</Text>
            <Text style={styles.sliderLabel}>90% (strict)</Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={saveSettings}>
          <Text style={styles.saveBtnText}>💾 Save Settings</Text>
        </TouchableOpacity>

        {/* About */}
        <View style={styles.about}>
          <Text style={styles.aboutTitle}>RoadWatch AI</Text>
          <Text style={styles.aboutText}>
            AI-powered pothole detection & civic reporting platform
          </Text>
          <Text style={styles.aboutVersion}>v1.0.0</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060a14",
  },
  header: {
    padding: 20,
    paddingTop: 56,
    backgroundColor: "#0c1222",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(99, 102, 241, 0.12)",
  },
  headerTitle: {
    color: "#f1f5f9",
    fontSize: 22,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: "#64748b",
    fontSize: 13,
    marginTop: 2,
  },
  content: {
    padding: 20,
    flex: 1,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  input: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.15)",
    borderRadius: 10,
    padding: 12,
    color: "#f1f5f9",
    fontSize: 14,
    fontFamily: "monospace",
  },
  connectionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },
  testBtn: {
    backgroundColor: "rgba(99, 102, 241, 0.12)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.2)",
  },
  testBtnText: {
    color: "#a5b4fc",
    fontSize: 13,
    fontWeight: "600",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    color: "#94a3b8",
    fontSize: 12,
  },
  sliderValue: {
    color: "#a5b4fc",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderLabel: {
    color: "#64748b",
    fontSize: 11,
  },
  saveBtn: {
    backgroundColor: "#6366f1",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  about: {
    alignItems: "center",
    marginTop: 40,
    opacity: 0.5,
  },
  aboutTitle: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "700",
  },
  aboutText: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 2,
  },
  aboutVersion: {
    color: "#475569",
    fontSize: 10,
    marginTop: 4,
  },
});
