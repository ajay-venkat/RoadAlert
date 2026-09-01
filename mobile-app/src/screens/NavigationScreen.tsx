import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';

// Fallback/Mock for turn-by-turn if Mapbox isn't available
export default function NavigationScreen({ navigation }: any) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
      
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);

      // Simulate live updates
      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 5 },
        (newLoc) => setLocation(newLoc)
      );
    })();
  }, []);

  const handleStartNavigation = () => {
    setIsNavigating(true);
    Speech.speak('Starting navigation. Head north on the current road.');
  };

  const handleReportIssue = () => {
    // Navigate to camera capture screen
    navigation.navigate('Capture');
  };

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map} 
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={isNavigating}
        userInterfaceStyle="dark"
        customMapStyle={mapStyle} // Asphalt theme
      >
        {isNavigating && (
           <Polyline
             coordinates={[
               { latitude: location.coords.latitude, longitude: location.coords.longitude },
               { latitude: location.coords.latitude + 0.005, longitude: location.coords.longitude + 0.005 } // Mock route
             ]}
             strokeColor="#F4C430" // Lane Yellow
             strokeWidth={6}
           />
        )}
      </MapView>
      
      {/* Chrome Overlay */}
      <SafeAreaView style={styles.overlay}>
        {!isNavigating ? (
          <View style={styles.topCard}>
            <Text style={styles.title}>RoadAlert</Text>
            <TouchableOpacity style={styles.startButton} onPress={handleStartNavigation}>
              <Text style={styles.startButtonText}>START NAVIGATION</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.navHeader}>
            <Text style={styles.navInstruction}>Continue Straight for 500m</Text>
            <Text style={styles.navEta}>5 min • 1.2 km</Text>
          </View>
        )}
      </SafeAreaView>

      {/* Report Button (Octagon) */}
      <TouchableOpacity style={styles.reportButton} onPress={handleReportIssue}>
        <View style={styles.octagon}>
          <Text style={styles.reportText}>REPORT</Text>
          <Text style={styles.reportText}>ISSUE</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C1E22' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1C1E22' },
  loadingText: { color: '#F5F0E8', fontFamily: 'Inter' },
  map: { width: Dimensions.get('window').width, height: Dimensions.get('window').height },
  overlay: { position: 'absolute', top: 0, width: '100%' },
  topCard: { backgroundColor: '#1C1E22', margin: 16, padding: 20, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  title: { color: '#F5F0E8', fontSize: 24, fontWeight: 'bold', fontFamily: 'Barlow Condensed', marginBottom: 16 },
  startButton: { backgroundColor: '#F4C430', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  startButtonText: { color: '#1C1E22', fontWeight: 'bold', fontFamily: 'Inter' },
  navHeader: { backgroundColor: '#1C1E22', margin: 16, padding: 16, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#F4C430' },
  navInstruction: { color: '#F5F0E8', fontSize: 22, fontWeight: 'bold', fontFamily: 'Barlow Condensed' },
  navEta: { color: '#4C8B6B', fontSize: 16, fontWeight: 'bold', fontFamily: 'JetBrains Mono', marginTop: 4 },
  
  // Report Button
  reportButton: { position: 'absolute', bottom: 40, right: 20, zIndex: 100 },
  octagon: {
    width: 80, height: 80, backgroundColor: '#E6552E', 
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    // Rough CSS octagon shape approximation using borderRadius
    borderRadius: 20, transform: [{ rotate: '45deg' }]
  },
  reportText: { color: '#F5F0E8', fontWeight: 'bold', fontSize: 14, fontFamily: 'Barlow Condensed', transform: [{ rotate: '-45deg' }] }
});

const mapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] }
];
