// This file is only used on mobile (not web)
import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../styles/commonStyles';

export const TheaterMapView = ({ userLocation, theaters }) => {
  let MapModule;
  try {
    // Dynamically require to avoid crashing Expo Go if native module isn't available
    MapModule = require('react-native-maps');
  } catch (e) {
    MapModule = null;
  }

  if (!MapModule || !MapModule.default) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 16, color: colors.text, textAlign: 'center' }}>
          Map view requires a dev client or a build with react-native-maps.
        </Text>
      </View>
    );
  }

  const MapView = MapModule.default;
  const { Marker } = MapModule;

  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.15,
        longitudeDelta: 0.15,
      }}
    >
      {/* User location marker */}
      <Marker
        coordinate={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        }}
        title="You are here"
        pinColor={colors.secondary}
      />

      {/* Theater markers */}
      {theaters.map((theater) => (
        <Marker
          key={theater.id}
          coordinate={{
            latitude: theater.latitude,
            longitude: theater.longitude,
          }}
          title={theater.name}
          description={`${theater.distance} km away`}
          pinColor={colors.primary}
        />
      ))}
    </MapView>
  );
};
