export type LatLng = { latitude: number; longitude: number };

export type CameraState = {
  center: LatLng;
  zoom?: number; // hint only
  pitch?: number;
  heading?: number;
};

export type MapProps = {
  initialCamera: CameraState;
  onRegionChange?: (camera: CameraState) => void;
  onPress?: (coord: LatLng) => void;
  children?: React.ReactNode;
  showsUserLocation?: boolean;
};

export type MapRef = {
  animateTo: (camera: CameraState, durationMs?: number) => void;
};

export type MapMarkerProps = {
  id?: string;
  coordinate: LatLng;
  onPress?: () => void;
  image?: any; // require('path/to.png')
};

export type UserLocationProps = {
  visible?: boolean;
};
