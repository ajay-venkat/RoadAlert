import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Image, Animated } from 'react-native';

export default function ConfirmationScreen({ route, navigation }: any) {
  const { ticketId, mlaName, constituency, photoUri } = route.params;

  // Animation values for the car/marker sliding along the dashed line
  const [slideAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animate the status marker moving from left to right (mocking 'New' to 'Assigned' slowly)
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 1500, // 1.5 seconds slide
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const markerTranslateX = slideAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, 120, 240], // Moving across the line
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>REPORT FILED</Text>
        </View>

        {/* Ticket Card (Signage Style) */}
        <View style={styles.ticketCard}>
          {photoUri && (
             <Image source={{ uri: photoUri }} style={styles.photo} />
          )}
          <View style={styles.ticketInfo}>
             <Text style={styles.ticketLabel}>TICKET NO.</Text>
             <Text style={styles.ticketId}>#{ticketId}</Text>
             
             <View style={styles.dashedDivider} />

             <Text style={styles.ticketLabel}>ROUTED TO</Text>
             <Text style={styles.mlaName}>{mlaName}</Text>
             <Text style={styles.constituency}>{constituency} Constituency</Text>
          </View>
        </View>

        {/* Status Tracker */}
        <View style={styles.trackerContainer}>
          <Text style={styles.trackerTitle}>TICKET STATUS</Text>
          
          <View style={styles.trackLineContainer}>
             {/* The dashed lane-marking line */}
             <View style={styles.dashedLane} />
             
             {/* The animated marker */}
             <Animated.View style={[styles.statusMarker, { transform: [{ translateX: markerTranslateX }] }]} />
          </View>

          <View style={styles.statusLabels}>
             <Text style={[styles.statusLabel, { color: '#E6552E' }]}>NEW</Text>
             <Text style={[styles.statusLabel, { color: '#F5F0E8' }]}>ASSIGNED</Text>
             <Text style={[styles.statusLabel, { color: '#4C8B6B' }]}>FIXED</Text>
          </View>
        </View>

      </View>

      <TouchableOpacity style={styles.doneButton} onPress={() => navigation.navigate('Navigation')}>
        <Text style={styles.doneButtonText}>RESUME NAVIGATION</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C1E22', justifyContent: 'space-between' },
  content: { padding: 20 },
  
  header: { alignItems: 'center', marginVertical: 20 },
  headerTitle: { color: '#F4C430', fontSize: 32, fontFamily: 'Barlow Condensed', fontWeight: 'bold' },

  ticketCard: { 
    backgroundColor: '#1C1E22', 
    borderWidth: 2, 
    borderColor: '#5B6470',
    borderRadius: 12, 
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }
  },
  photo: { width: '100%', height: 200 },
  ticketInfo: { padding: 20 },
  ticketLabel: { color: '#5B6470', fontFamily: 'Inter', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  ticketId: { color: '#F5F0E8', fontFamily: 'JetBrains Mono', fontSize: 24, fontWeight: 'bold' },
  dashedDivider: { height: 1, borderTopWidth: 2, borderColor: '#F4C430', borderStyle: 'dashed', marginVertical: 16 },
  mlaName: { color: '#F5F0E8', fontFamily: 'Inter', fontSize: 20, fontWeight: 'bold' },
  constituency: { color: '#5B6470', fontFamily: 'Inter', fontSize: 14, marginTop: 4 },

  trackerContainer: { marginTop: 40, padding: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  trackerTitle: { color: '#F5F0E8', fontFamily: 'Barlow Condensed', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  trackLineContainer: { position: 'relative', height: 24, justifyContent: 'center', marginBottom: 10 },
  dashedLane: { height: 4, width: '100%', borderTopWidth: 4, borderColor: '#F4C430', borderStyle: 'dashed' },
  statusMarker: { position: 'absolute', left: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: '#E6552E', borderWidth: 4, borderColor: '#1C1E22' },
  statusLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  statusLabel: { fontFamily: 'Barlow Condensed', fontSize: 16, fontWeight: 'bold' },

  doneButton: { backgroundColor: '#F4C430', margin: 20, paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
  doneButtonText: { color: '#1C1E22', fontFamily: 'Inter', fontWeight: 'bold', fontSize: 16 },
});
