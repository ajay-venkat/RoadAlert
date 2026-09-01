import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client - replaced by env variables in prod
const supabaseUrl = 'https://placeholder-url.supabase.co';
const supabaseAnonKey = 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ReportScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    (async () => {
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need camera access to capture the road issue.</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || isProcessing || !location) return;

    try {
      setIsProcessing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
      });

      // MOCK: In a real app, upload photo to Supabase Storage,
      // call Supabase function to find constituency, and insert into reports table.
      // For demo, we just navigate to confirmation and pass mock data.

      // Mock ticket creation
      const mockTicketId = Math.random().toString(36).substring(2, 10).toUpperCase();

      navigation.navigate('Confirmation', {
        ticketId: mockTicketId,
        mlaName: 'MK Mohan',
        constituency: 'Anna Nagar',
        photoUri: photo?.uri,
      });
    } catch (error) {
      console.error('Error capturing report:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />

      {/* Overlay Chrome */}
      <SafeAreaView style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>✕ CANCEL</Text>
          </TouchableOpacity>
          <View style={styles.gpsBadge}>
            <Text style={styles.gpsText}>
              {location ? `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}` : 'Locating...'}
            </Text>
          </View>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.captureButton} 
            onPress={handleCapture}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#1C1E22" />
            ) : (
              <View style={styles.captureInner} />
            )}
          </TouchableOpacity>
          <Text style={styles.helperText}>Tap to capture road issue</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C1E22' },
  camera: { flex: 1 },
  overlay: { flex: 1, position: 'absolute', width: '100%', height: '100%', justifyContent: 'space-between' },
  
  // Top bar
  topBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center' },
  backBtn: { backgroundColor: '#1C1E22', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  backBtnText: { color: '#F5F0E8', fontFamily: 'Inter', fontWeight: 'bold' },
  gpsBadge: { backgroundColor: 'rgba(28,30,34,0.7)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  gpsText: { color: '#F4C430', fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 'bold' },
  
  // Bottom bar
  bottomBar: { alignItems: 'center', paddingBottom: 40, backgroundColor: 'rgba(0,0,0,0.4)', paddingTop: 20 },
  captureButton: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#F4C430',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 4, borderColor: 'rgba(244,196,48,0.3)',
  },
  captureInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F4C430', borderWidth: 2, borderColor: '#1C1E22' },
  helperText: { color: '#F5F0E8', fontFamily: 'Inter', marginTop: 16, fontSize: 16, fontWeight: 'bold' },

  // Permission
  permissionContainer: { flex: 1, backgroundColor: '#1C1E22', justifyContent: 'center', alignItems: 'center', padding: 20 },
  permissionText: { color: '#F5F0E8', fontFamily: 'Inter', fontSize: 18, textAlign: 'center', marginBottom: 20 },
  permissionBtn: { backgroundColor: '#F4C430', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  permissionBtnText: { color: '#1C1E22', fontFamily: 'Inter', fontWeight: 'bold' }
});
