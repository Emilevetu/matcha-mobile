import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { MapProps, MapRef, CameraState } from '../Map.types';

function cameraToRegion(c: CameraState): Region {
  const latitudeDelta = 0.05; // simple fallback – RNM n'a pas de zoom natif
  const longitudeDelta = 0.05;
  return {
    latitude: c.center.latitude,
    longitude: c.center.longitude,
    latitudeDelta,
    longitudeDelta,
  };
}

export const RNMMapView = forwardRef<MapRef, MapProps>((props, ref) => {
  const mapRef = useRef<MapView>(null);

  useImperativeHandle(ref, () => ({
    animateTo: (c: CameraState, durationMs = 500) => {
      mapRef.current?.animateToRegion(cameraToRegion(c), durationMs);
    },
  }));

  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      provider={PROVIDER_DEFAULT} // Apple Maps par défaut sur iOS
      initialRegion={cameraToRegion(props.initialCamera)}
      onRegionChangeComplete={(r) => {
        props.onRegionChange?.({
          center: { latitude: r.latitude, longitude: r.longitude },
        });
      }}
      onPress={(e) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        props.onPress?.({ latitude, longitude });
      }}
      showsUserLocation={!!props.showsUserLocation}
      pitchEnabled
      rotateEnabled
      showsCompass
    >
      {props.children}
    </MapView>
  );
});
