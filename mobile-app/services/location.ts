/**
 * RoadWatch AI — Location Service
 * GPS tracking with expo-location for continuous foreground updates.
 */

import * as Location from "expo-location";
import { Alert } from "react-native";

export interface GPSCoords {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
}

let locationSubscription: Location.LocationSubscription | null = null;

/**
 * Request location permissions.
 */
export async function requestLocationPermission(): Promise<boolean> {
  const { status: foreground } =
    await Location.requestForegroundPermissionsAsync();

  if (foreground !== "granted") {
    Alert.alert(
      "Location Permission Required",
      "RoadWatch AI needs GPS access to tag detection locations. Please enable location in your device settings.",
      [{ text: "OK" }]
    );
    return false;
  }

  return true;
}

/**
 * Get the current GPS position once.
 */
export async function getCurrentLocation(): Promise<GPSCoords | null> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return null;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      speed: location.coords.speed,
    };
  } catch (error) {
    console.error("Failed to get location:", error);
    return null;
  }
}

/**
 * Start continuous foreground location tracking.
 */
export async function startLocationTracking(
  onUpdate: (coords: GPSCoords) => void,
  intervalMs: number = 3000
): Promise<boolean> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return false;

    // Stop any existing subscription
    stopLocationTracking();

    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: intervalMs,
        distanceInterval: 5, // Minimum 5m movement
      },
      (location) => {
        onUpdate({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          speed: location.coords.speed,
        });
      }
    );

    return true;
  } catch (error) {
    console.error("Failed to start location tracking:", error);
    return false;
  }
}

/**
 * Stop continuous location tracking.
 */
export function stopLocationTracking() {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }
}
