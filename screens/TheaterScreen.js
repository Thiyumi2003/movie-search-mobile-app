import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  StyleSheet
} from 'react-native';
import { TheaterMapView } from './TheaterMapView';
import { getCurrentLocation, findNearbyTheaters, findTheatersShowingMovie, openShowtimesSearch } from '../utils/locationService';
import { commonStyles, colors } from '../styles/commonStyles';

export default function TheaterScreen({ route, navigation }) {
  const { movieTitle } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [theaters, setTheaters] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState(null);
  const [showMap, setShowMap] = useState(false); // Default to list view

  // Only show map toggle on mobile
  const isNative = Platform.OS !== 'web';

  useEffect(() => {
    loadTheaters();
  }, []);

  const loadTheaters = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user's current location
      const location = await getCurrentLocation();
      setUserLocation(location);

      // If a movie title is provided and Google Places key is configured, try showtimes search
      let nearbyTheaters = [];
      if (movieTitle) {
        try {
          nearbyTheaters = await findTheatersShowingMovie(movieTitle, location.latitude, location.longitude);
        } catch (e) {
          // Fallback to generic nearby theaters if showtimes search fails
          nearbyTheaters = await findNearbyTheaters(location.latitude, location.longitude);
        }
      } else {
        // Generic nearby theaters
        nearbyTheaters = await findNearbyTheaters(location.latitude, location.longitude);
      }
      
      // Sort by distance
      nearbyTheaters.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
      
      setTheaters(nearbyTheaters);
    } catch (err) {
      setError(err.message);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const openInMaps = (theater) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(theater.name)}@${theater.latitude},${theater.longitude}`,
      android: `geo:0,0?q=${theater.latitude},${theater.longitude}(${encodeURIComponent(theater.name)})`,
    });
    
    Linking.openURL(url);
  };

  const callTheater = (theater) => {
    // In a real app, you'd get phone number from Google Places Details API
    Alert.alert('Call Theater', `Would call ${theater.name}\n(Phone number not available in this demo)`);
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, fontSize: 16, color: colors.text }}>
          {movieTitle ? `Finding theaters for "${movieTitle}"...` : 'Finding nearby theaters...'}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[commonStyles.container, { padding: 20 }]}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.error, marginBottom: 12 }}>
          Unable to Find Theaters
        </Text>
        <Text style={{ fontSize: 14, color: colors.text, marginBottom: 20 }}>
          {error}
        </Text>
        <TouchableOpacity
          style={[commonStyles.searchButton, { width: '100%' }]}
          onPress={loadTheaters}
        >
          <Text style={{ color: colors.white, fontWeight: 'bold' }}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[commonStyles.searchButton, { width: '100%', marginTop: 12, backgroundColor: colors.secondary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: colors.white, fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      {/* Header */}
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 24, color: colors.primary }}>← Back</Text>
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>
          {movieTitle ? `Theaters for "${movieTitle}"` : 'Nearby Movie Theaters'}
        </Text>
        <Text style={{ fontSize: 14, color: colors.text, marginTop: 4 }}>
          Found {theaters.length} theater(s) within 20km
        </Text>

        {/* Toggle View - Only show on native */}
        {isNative && (
          <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 8,
                backgroundColor: showMap ? colors.primary : colors.background,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              onPress={() => setShowMap(true)}
            >
              <Text style={{ 
                textAlign: 'center', 
                color: showMap ? colors.white : colors.text,
                fontWeight: '600'
              }}>
                🗺️ Map View
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 8,
                backgroundColor: !showMap ? colors.primary : colors.background,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              onPress={() => setShowMap(false)}
            >
              <Text style={{ 
                textAlign: 'center', 
                color: !showMap ? colors.white : colors.text,
                fontWeight: '600'
              }}>
                📋 List View
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Map View - Only render on native */}
      {isNative && showMap && userLocation && (
        <TheaterMapView userLocation={userLocation} theaters={theaters} />
      )}

      {/* List View */}
      {(!isNative || !showMap) && (
        <ScrollView style={{ flex: 1 }}>
          {theaters.map((theater, index) => (
            <View key={theater.id} style={styles.theaterCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.theaterName}>{theater.name}</Text>
                <Text style={styles.theaterAddress}>{theater.address}</Text>
                
                <View style={{ flexDirection: 'row', marginTop: 8, gap: 12 }}>
                  <Text style={styles.theaterInfo}>📍 {theater.distance} km</Text>
                  {theater.rating !== 'N/A' && (
                    <Text style={styles.theaterInfo}>⭐ {theater.rating}</Text>
                  )}
                  {theater.isOpen !== undefined && (
                    <Text style={[styles.theaterInfo, { color: theater.isOpen ? colors.success : colors.error }]}>
                      {theater.isOpen ? '🟢 Open' : '🔴 Closed'}
                    </Text>
                  )}
                </View>
              </View>

              <View style={{ gap: 8 }}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => openInMaps(theater)}
                >
                  <Text style={styles.actionBtnText}>🗺️ Directions</Text>
                </TouchableOpacity>
                {movieTitle && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
                    onPress={() => openShowtimesSearch(movieTitle, theater.name)}
                  >
                    <Text style={styles.actionBtnText}>🎟️ Showtimes</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          {theaters.length === 0 && (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, color: colors.text }}>
                No theaters found within 20km radius
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  theaterCard: {
    backgroundColor: colors.white,
    margin: 12,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  theaterName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  theaterAddress: {
    fontSize: 13,
    color: colors.textLight,
  },
  theaterInfo: {
    fontSize: 12,
    color: colors.text,
  },
  actionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});
