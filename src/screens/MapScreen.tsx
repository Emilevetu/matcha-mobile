import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Button, Alert, TouchableOpacity } from 'react-native';
import { Map, MapMarker } from '../map/Map';
import { usePlaces } from '../hooks/usePlaces';
import type { MapRef } from '../map/Map.types';
import * as Location from 'expo-location';
import { PlaceSheet } from '../components/PlaceSheet';

const MapScreen = () => {
  const { data: places, isLoading, error } = usePlaces();
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const mapRef = useRef<MapRef>(null);

  // Suppression du recentrage automatique - seulement manuel via le bouton

  // Fonction de recentrage ULTRA-RAPIDE utilisant la position en cache
  const recenterToUserLocation = () => {
    if (userLocation) {
      console.log('⚡ Recentrage instantané avec position en cache:', userLocation);
      // Animation 3x plus rapide (300ms au lieu de 1000ms)
      mapRef.current?.animateTo({
        center: userLocation,
        zoom: 15
      }, 300);
    } else {
      console.log('📍 Position non disponible, obtention de la localisation...');
      getCurrentLocation();
    }
  };

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
        {places?.map((place, index) => {
          console.log(`🗺️ Rendu marqueur ${index + 1}:`, {
            name: place.name,
            lat: place.lat,
            lng: place.lng,
            visible: true
          });
          return (
            <MapMarker
              key={index}
              coordinate={{
                latitude: place.lat,
                longitude: place.lng,
              }}
              onPress={() => {
                console.log(`📍 Clic sur marqueur ${index + 1}:`, place.name);
                setSelectedPlace(place);
              }}
            />
          );
        })}
      </Map>

      {/* Bouton de recentrage ULTRA-RAPIDE */}
      <TouchableOpacity 
        style={styles.recenterButton}
        onPress={recenterToUserLocation}
        disabled={locationLoading}
      >
        <Text style={styles.recenterIcon}>🧭</Text>
      </TouchableOpacity>

      {/* Overlay invisible pour fermer la PlaceSheet en cliquant sur la carte */}
      {selectedPlace && (
        <TouchableOpacity 
          style={styles.mapOverlay}
          onPress={() => setSelectedPlace(null)}
          activeOpacity={1}
        />
      )}

      {/* PlaceSheet */}
      <PlaceSheet 
        place={selectedPlace} 
        onClose={() => setSelectedPlace(null)} 
      />

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
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: '50%', // Couvre seulement la moitié haute de l'écran
    backgroundColor: 'transparent',
  },
});

export default MapScreen;