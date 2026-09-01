/**
 * RoadWatch AI — History Screen
 * Shows past detections from the backend.
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
} from "react-native";
import { fetchDetections, DetectionResult, getApiBase } from "../services/api";

const SEVERITY_COLORS: Record<string, string> = {
  minor: "#22c55e",
  moderate: "#f59e0b",
  severe: "#ef4444",
};

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  const mins = Math.floor(diff / (1000 * 60));
  return mins > 0 ? `${mins}m ago` : "just now";
}

export default function HistoryScreen() {
  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetchDetections(50);
      setDetections(response.detections);
    } catch (err: any) {
      setError(err.message || "Failed to load detections");
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderDetection = ({ item }: { item: DetectionResult }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardId}>#{item.id}</Text>
        <View
          style={[
            styles.severityBadge,
            {
              backgroundColor: (SEVERITY_COLORS[item.overall_severity] || "#6366f1") + "20",
            },
          ]}
        >
          <Text
            style={[
              styles.severityText,
              { color: SEVERITY_COLORS[item.overall_severity] || "#6366f1" },
            ]}
          >
            {item.overall_severity.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardInfo}>
          <Text style={styles.locationText}>
            📍{" "}
            {item.lat && item.lon
              ? `${item.lat.toFixed(4)}°, ${item.lon.toFixed(4)}°`
              : "No location"}
          </Text>
          <Text style={styles.timeText}>🕐 {formatTimestamp(item.timestamp)}</Text>
          <Text style={styles.confText}>
            🎯 {(item.max_confidence * 100).toFixed(0)}% • {item.detection_count}{" "}
            detection{item.detection_count !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === "fixed"
                  ? "#22c55e20"
                  : item.status === "in_progress"
                  ? "#f59e0b20"
                  : "#6366f120",
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color:
                  item.status === "fixed"
                    ? "#22c55e"
                    : item.status === "in_progress"
                    ? "#f59e0b"
                    : "#6366f1",
              },
            ]}
          >
            {item.status.replace("_", " ")}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Detection History</Text>
        <Text style={styles.headerSubtitle}>
          {detections.length} detection{detections.length !== 1 ? "s" : ""} recorded
        </Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={detections}
          keyExtractor={(item) => item.id}
          renderItem={renderDetection}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6366f1"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No detections yet</Text>
              <Text style={styles.emptySubtext}>
                Start capturing road footage to see detections here
              </Text>
            </View>
          }
        />
      )}
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
  list: {
    padding: 12,
    gap: 10,
  },
  card: {
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.12)",
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardId: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  cardBody: {
    flexDirection: "row",
    gap: 10,
  },
  cardInfo: {
    flex: 1,
  },
  locationText: {
    color: "#94a3b8",
    fontSize: 12,
    marginBottom: 2,
  },
  timeText: {
    color: "#64748b",
    fontSize: 11,
    marginBottom: 2,
  },
  confText: {
    color: "#a5b4fc",
    fontSize: 11,
  },
  cardFooter: {
    marginTop: 8,
    flexDirection: "row",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  errorText: {
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: "white",
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    padding: 60,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
    opacity: 0.5,
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubtext: {
    color: "#64748b",
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },
});
