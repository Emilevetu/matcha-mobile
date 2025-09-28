import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Button, Alert, TouchableOpacity } from 'react-native';
import { Map, MapMarker } from '../map/Map';
import { usePlaces } from '../hooks/usePlaces';
import type { MapRef } from '../map/Map.types';
import * as Location from 'expo-location';

const MapScreen = () => {
  const { data: places, isLoading, error } = usePlaces();
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const mapRef = useRef<MapRef>(null);

  // Obtenir la localisation de l'utilisateur
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      console.log('📍 Demande de permission de localisation...');
      
      // Demander la permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('❌ Permission de localisation refusée');
        Alert.alert(
          'Permission requise',
          'L\'application a besoin d\'accéder à votre localisation pour vous montrer les cafés à proximité.'
        );
        return;
      }

      console.log('✅ Permission accordée, obtention de la position...');
      
      // Obtenir la position actuelle
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      console.log('📍 Position obtenue:', { latitude, longitude });
      
      setUserLocation({ latitude, longitude });
      
      // Centrer la carte sur la position de l'utilisateur
      mapRef.current?.animateTo({
        center: { latitude, longitude },
        zoom: 15
      }, 1000);
      
    } catch (error) {
      console.error('❌ Erreur de localisation:', error);
      Alert.alert('Erreur', 'Impossible d\'obtenir votre position');
    } finally {
      setLocationLoading(false);
    }
  };

  // Logs détaillés pour le diagnostic
  console.log('🗺️ MapScreen - État de chargement:', { isLoading, error, placesCount: places?.length });
  
  if (isLoading) {
    console.log('⏳ MapScreen - Chargement en cours...');
  }
  
  if (error) {
    console.error('❌ MapScreen - Erreur:', error);
  }
  
  if (places) {
    console.log('✅ MapScreen - Places chargées:', places.length, 'lieux');
    places.forEach((place, index) => {
      console.log(`📍 Place ${index + 1}:`, {
        name: place.name,
        lat: place.lat,
        lng: place.lng,
        address: place.address
      });
    });
  }

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
    <View style={styles.container}>
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

      {/* Bouton de recentrage sur la position */}
      <TouchableOpacity 
        style={styles.recenterButton}
        onPress={getCurrentLocation}
        disabled={locationLoading}
      >
        <Text style={styles.recenterIcon}>🧭</Text>
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 0,
    paddingTop: 0,
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
  recenterButton: {
    position: 'absolute',
    bottom: 120,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  recenterIcon: {
    fontSize: 20,
  },
});

export default MapScreen;