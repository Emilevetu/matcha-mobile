import React, { forwardRef } from 'react';
import { MAP_PROVIDER } from '../env';
import { MapProps, MapRef, MapMarkerProps, UserLocationProps } from './Map.types';

// RNM
import { RNMMapView } from './provider-rnm/MapView';
import { RNMMarker } from './provider-rnm/MapMarker';
import { RNMUserLocation } from './provider-rnm/UserLocation';

// Expo (stubs)
import { ExpoMapView } from './provider-expo/MapView';
import { ExpoMarker } from './provider-expo/MapMarker';
import { ExpoUserLocation } from './provider-expo/UserLocation';

export const Map = forwardRef<MapRef, MapProps>((props, ref) => {
  if (MAP_PROVIDER === 'EXPO') return <ExpoMapView {...props} ref={ref} />;
  return <RNMMapView {...props} ref={ref} />;
});

export function MapMarker(props: MapMarkerProps) {
  if (MAP_PROVIDER === 'EXPO') return <ExpoMarker {...props} />;
  return <RNMMarker {...props} />;
}

export function UserLocation(props: UserLocationProps) {
  if (MAP_PROVIDER === 'EXPO') return <ExpoUserLocation {...props} />;
  return <RNMUserLocation {...props} />;
}
