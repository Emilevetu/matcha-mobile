import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Button, Alert, TouchableOpacity } from 'react-native';
import { Map, MapMarker } from '../map/Map';
import { usePlaces } from '../hooks/usePlaces';
import type { MapRef } from '../map/Map.types';
import * as Location from 'expo-location';
import { PlaceSheet } from '../components/PlaceSheet';
import { usePlace } from '../contexts/PlaceContext';
import { Navigation, Globe, Users, User } from 'react-native-feather';

const MapScreen = () => {
  const { data: places, isLoading, error } = usePlaces();
  const { selectedPlace, setSelectedPlace } = usePlace();
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'globe' | 'group' | 'user'>('group');
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
      {/* Toggle de filtres style Poop Map */}
      {!selectedPlace && (
        <View style={styles.filterToggle}>
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'globe' && styles.selectedFilter]}
          onPress={() => setSelectedFilter('globe')}
        >
          <Globe size={20} color={selectedFilter === 'globe' ? '#FFFFFF' : '#8B8B8B'} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'group' && styles.selectedFilter]}
          onPress={() => setSelectedFilter('group')}
        >
          <Users size={20} color={selectedFilter === 'group' ? '#FFFFFF' : '#8B8B8B'} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'user' && styles.selectedFilter]}
          onPress={() => setSelectedFilter('user')}
        >
          <User size={20} color={selectedFilter === 'user' ? '#FFFFFF' : '#8B8B8B'} />
        </TouchableOpacity>
        </View>
      )}

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
        <Navigation size={20} color="#8B8B8B" />
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
      <PlaceSheet />

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
    paddingTop: 1, // Ajuste légèrement vers le bas
    paddingLeft: -9, // Décale 3x plus vers la gauche (1 * 3 = 3, +1 pour plus de précision)
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: '50%', // Couvre seulement la moitié haute de l'écran
    backgroundColor: 'transparent',
  },
  // Styles pour le toggle de filtres
  filterToggle: {
    position: 'absolute',
    top: 90, // Position ajustée
    left: '50%',
    transform: [{ translateX: -95 }], // Centre parfaitement le toggle (ajusté)
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 4, // Padding réduit (moitié de l'espace blanc)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  filterButton: {
    width: 50,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  selectedFilter: {
    backgroundColor: '#F6B7C0', // Rose pour la sélection
  },
});

export default MapScreen;