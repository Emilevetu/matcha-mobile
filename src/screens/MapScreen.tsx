import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Button } from 'react-native';
import { Map, MapMarker } from '../map/Map';
import { usePlaces } from '../hooks/usePlaces';
import type { MapRef } from '../map/Map.types';

const MapScreen = () => {
  const { data: places, isLoading, error } = usePlaces();
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const mapRef = useRef<MapRef>(null);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>Chargement de la carte...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text>Erreur lors du chargement</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Map
        ref={mapRef}
        initialCamera={{ 
          center: { latitude: 48.857, longitude: 2.352 }, 
          zoom: 13 
        }}
        showsUserLocation
        onRegionChange={() => {}}
      >
        {places?.map((place, index) => (
          <MapMarker
            key={index}
            coordinate={{
              latitude: place.lat,
              longitude: place.lng,
            }}
            onPress={() => setSelectedPlace(place)}
          />
        ))}
      </Map>

      {selectedPlace && (
        <View style={styles.placeInfo}>
          <Text style={styles.placeName}>{selectedPlace.name}</Text>
          <Text style={styles.placeAddress}>{selectedPlace.address}</Text>
        </View>
      )}

      <View style={styles.controls}>
        <Button
          title="Recentrer Paris"
          onPress={() =>
            mapRef.current?.animateTo({ 
              center: { latitude: 48.857, longitude: 2.352 }, 
              zoom: 13 
            }, 500)
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeInfo: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  placeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B9A46',
    marginBottom: 4,
  },
  placeAddress: {
    fontSize: 14,
    color: '#6B7A3A',
  },
  controls: {
    position: 'absolute',
    top: 50,
    right: 16,
  },
});

export default MapScreen;