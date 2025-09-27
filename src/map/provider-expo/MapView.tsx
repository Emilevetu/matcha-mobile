import React, { forwardRef, useImperativeHandle } from 'react';
import { MapProps, MapRef, CameraState } from '../Map.types';

// TODO: remplacer par expo-maps (MapView, Camera, styleURL etc.)
export const ExpoMapView = forwardRef<MapRef, MapProps>((props, ref) => {
  useImperativeHandle(ref, () => ({
    animateTo: (_c: CameraState, _d?: number) => {},
  }));
  return <>{props.children}</>;
});
