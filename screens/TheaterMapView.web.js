// Web fallback - map not supported
import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../styles/commonStyles';

export const TheaterMapView = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 16, color: colors.text, textAlign: 'center' }}>
        Map view is only available on mobile devices
      </Text>
    </View>
  );
};
