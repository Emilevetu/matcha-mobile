import React from 'react';
import { Marker } from 'react-native-maps';
import { MapMarkerProps } from '../Map.types';

export function RNMMarker({ coordinate, onPress, image }: MapMarkerProps) {
  return (
    <Marker coordinate={coordinate} onPress={onPress} image={image} />
  );
}
