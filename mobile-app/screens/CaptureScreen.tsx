/**
 * RoadWatch AI — Capture Screen
 * Main camera capture screen with GPS tagging and batch upload.
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { GPSCoords, getCurrentLocation, startLocationTracking, stopLocationTracking } from "../services/location";
import { uploadForDetection, DetectionResult } from "../services/api";

const SEVERITY_COLORS = {
  minor: "#22c55e",
  moderate: "#f59e0b",
  severe: "#ef4444",
};

export default function CaptureScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  // State
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<GPSCoords | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [lastDetection, setLastDetection] = useState<DetectionResult | null>(null);
  const [captureInterval, setCaptureInterval] = useState(3000); // 3 seconds
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("Ready");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start/stop GPS tracking
  useEffect(() => {
    getCurrentLocation().then(setCurrentLocation);

    startLocationTracking((coords) => {
      setCurrentLocation(coords);
    }, 2000);

    return () => {
      stopLocationTracking();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Capture a single frame and upload
  const captureAndUpload = useCallback(async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      setStatusText("📸 Capturing...");

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: true,
      });

      if (!photo?.uri) return;

      setStatusText("🔄 Uploading...");

      const result = await uploadForDetection(
        photo.uri,
        currentLocation?.latitude,
        currentLocation?.longitude
      );

      setSessionCount((prev) => prev + 1);

      if (result.detection_count > 0) {
        setLastDetection(result);
        setStatusText(
          `✅ ${result.detection_count} detection(s) — ${result.overall_severity}`
        );
      } else {
        setStatusText("✅ No potholes detected");
      }
    } catch (error: any) {
      console.error("Capture error:", error);
      setStatusText(`❌ ${error.message?.slice(0, 50) || "Upload failed"}`);
    } finally {
      setIsProcessing(false);
    }
  }, [currentLocation, isProcessing]);

  // Toggle continuous capture
  const toggleCapture = () => {
    if (isCapturing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsCapturing(false);
      setStatusText("⏸ Paused");
    } else {
      setIsCapturing(true);
      setStatusText("▶️ Capturing...");

      // Capture immediately, then on interval
      captureAndUpload();
      intervalRef.current = setInterval(captureAndUpload, captureInterval);
    }
  };

  // Permission handling
  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          📷 Camera access is needed to capture road footage
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera Preview */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        />

        {/* Overlay: Status Bar */}
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <View style={styles.statusPill}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isCapturing ? "#22c55e" : "#64748b" },
                ]}
              />
              <Text style={styles.statusText}>
                {isCapturing ? "LIVE" : "IDLE"}
              </Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{sessionCount}</Text>
              <Text style={styles.countLabel}>detections</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Info Panel */}
      <View style={styles.infoPanel}>
        {/* GPS Info */}
        <View style={styles.gpsRow}>
          <Text style={styles.gpsIcon}>📍</Text>
          <Text style={styles.gpsText}>
            {currentLocation
              ? `${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}`
              : "Acquiring GPS..."}
          </Text>
          {currentLocation?.accuracy && (
            <Text style={styles.gpsAccuracy}>
              ±{currentLocation.accuracy.toFixed(0)}m
            </Text>
          )}
        </View>

        {/* Status */}
        <Text style={styles.statusMessage}>{statusText}</Text>

        {/* Last Detection */}
        {lastDetection && lastDetection.detection_count > 0 && (
          <View style={styles.lastDetection}>
            <View
              style={[
                styles.severityBadge,
                {
                  backgroundColor:
                    SEVERITY_COLORS[lastDetection.overall_severity] + "20",
                  borderColor:
                    SEVERITY_COLORS[lastDetection.overall_severity],
                },
              ]}
            >
              <Text
                style={[
                  styles.severityText,
                  {
                    color:
                      SEVERITY_COLORS[lastDetection.overall_severity],
                  },
                ]}
              >
                {lastDetection.overall_severity.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.confidenceText}>
              {(lastDetection.max_confidence * 100).toFixed(0)}% confidence
            </Text>
          </View>
        )}

        {/* Capture Button */}
        <TouchableOpacity
          style={[
            styles.captureBtn,
            isCapturing && styles.captureBtnActive,
          ]}
          onPress={toggleCapture}
        >
          <Text style={styles.captureBtnText}>
            {isCapturing ? "⏸  Stop Capture" : "▶️  Start Capture"}
          </Text>
        </TouchableOpacity>

        {/* Manual capture button */}
        <TouchableOpacity
          style={styles.manualBtn}
          onPress={captureAndUpload}
          disabled={isProcessing}
        >
          <Text style={styles.manualBtnText}>
            {isProcessing ? "Processing..." : "📸 Capture Once"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060a14",
  },
  cameraContainer: {
    flex: 1,
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 50,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  countBadge: {
    backgroundColor: "rgba(99, 102, 241, 0.8)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: "center",
  },
  countText: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },
  countLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 9,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoPanel: {
    backgroundColor: "#0c1222",
    padding: 20,
    paddingBottom: 40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(99, 102, 241, 0.15)",
  },
  gpsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  gpsIcon: {
    fontSize: 14,
  },
  gpsText: {
    color: "#94a3b8",
    fontSize: 13,
    fontFamily: "monospace",
  },
  gpsAccuracy: {
    color: "#64748b",
    fontSize: 11,
    marginLeft: "auto",
  },
  statusMessage: {
    color: "#a5b4fc",
    fontSize: 13,
    marginBottom: 12,
  },
  lastDetection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    padding: 10,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.12)",
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  severityText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  confidenceText: {
    color: "#94a3b8",
    fontSize: 12,
  },
  captureBtn: {
    backgroundColor: "#6366f1",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  captureBtnActive: {
    backgroundColor: "#ef4444",
  },
  captureBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  manualBtn: {
    backgroundColor: "rgba(99, 102, 241, 0.12)",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.2)",
  },
  manualBtnText: {
    color: "#a5b4fc",
    fontSize: 14,
    fontWeight: "600",
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: "#060a14",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  permissionText: {
    color: "#94a3b8",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
  permissionBtn: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionBtnText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
});
