import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Button, Alert, TouchableOpacity, Animated } from 'react-native';
import { Map, MapMarker } from '../map/Map';
import { usePlaces } from '../hooks/usePlaces';
import { useUserSpots } from '../hooks/useUserSpots';
import { useQueryClient } from '@tanstack/react-query';
import type { MapRef } from '../map/Map.types';
import * as Location from 'expo-location';
import { PlaceSheet } from '../components/PlaceSheet';
import { usePlace } from '../contexts/PlaceContext';
import { Navigation, Globe, Users, User, Menu } from 'react-native-feather';
import SlideMenuScreen from './SlideMenuScreen';

const MapScreen = () => {
  const { data: places, isLoading, error } = usePlaces();
  const { data: userSpots, isLoading: loadingUserSpots } = useUserSpots();
  const { selectedPlace, setSelectedPlace } = usePlace();
  const queryClient = useQueryClient();
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'globe' | 'group' | 'user'>('group');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const mapRef = useRef<MapRef>(null);
  const slideAnimation = useRef(new Animated.Value(-300)).current;

  // Déterminer quels spots afficher selon le toggle
  const getFilteredSpots = (): any[] => {
    if (selectedFilter === 'user') {
      return (userSpots as any[]) || [];
    }
    return (places as any[]) || [];
  };

  const filteredSpots = getFilteredSpots();
  const isLoadingFiltered = selectedFilter === 'user' ? loadingUserSpots : isLoading;

  // Fonctions pour le menu slide
  const openMenu = () => {
    setIsMenuOpen(true);
    Animated.timing(slideAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(slideAnimation, {
      toValue: -300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsMenuOpen(false);
    });
  };

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

  if (isLoadingFiltered) {
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
      {/* Bouton Menu hamburger en haut à gauche */}
      {!selectedPlace && (
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={openMenu}
        >
                <Menu width={20} height={20} color="#8B8B8B" />
        </TouchableOpacity>
      )}

      {/* Toggle de filtres style Poop Map */}
      {!selectedPlace && (
        <View style={styles.filterToggle}>
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'globe' && styles.selectedFilter]}
          onPress={() => setSelectedFilter('globe')}
        >
          <Globe width={20} height={20} color={selectedFilter === 'globe' ? '#FFFFFF' : '#8B8B8B'} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'group' && styles.selectedFilter]}
          onPress={() => setSelectedFilter('group')}
        >
          <Users width={20} height={20} color={selectedFilter === 'group' ? '#FFFFFF' : '#8B8B8B'} />
        </TouchableOpacity>
        
          <TouchableOpacity 
            style={[styles.filterButton, selectedFilter === 'user' && styles.selectedFilter]}
            onPress={() => {
              setSelectedFilter('user');
              // Rafraîchir les spots utilisateur à chaque clic
              queryClient.invalidateQueries({ queryKey: ['userSpots'] });
            }}
          >
          <User width={20} height={20} color={selectedFilter === 'user' ? '#FFFFFF' : '#8B8B8B'} />
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
        {filteredSpots?.map((place: any, index: number) => {
          console.log(`🗺️ Rendu marqueur ${index + 1} (${selectedFilter}):`, {
            name: place.name,
            lat: place.lat,
            lng: place.lng,
            visible: true
          });
          return (
            <MapMarker
              key={index}
              coordinate={{
                latitude: place.lat || 0,
                longitude: place.lng || 0,
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
        <Navigation width={20} height={20} color="#8B8B8B" />
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

      {/* Menu Slide depuis la gauche */}
      {isMenuOpen && (
        <Animated.View 
          style={[
            styles.slideMenuContainer,
            {
              transform: [{ translateX: slideAnimation }]
            }
          ]}
        >
          <SlideMenuScreen onClose={closeMenu} />
        </Animated.View>
      )}

      {/* Overlay pour fermer le menu en cliquant à côté */}
      {isMenuOpen && (
        <TouchableOpacity 
          style={styles.menuOverlay}
          onPress={closeMenu}
          activeOpacity={1}
        />
      )}

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
    transform: [{ translateX: -60 }], // Centre parfaitement le toggle réduit
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20, // Réduit pour correspondre à la hauteur
    padding: 2, // Padding réduit
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
    height: 40, // Hauteur fixe comme le bouton menu
  },
  filterButton: {
    width: 36, // Largeur réduite
    height: 36, // Hauteur réduite
    borderRadius: 18, // Border radius ajusté
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2, // Marges réduites
  },
  selectedFilter: {
    backgroundColor: '#ffe5e2', // Rose pour la sélection
  },
  // Styles pour le bouton menu hamburger
  menuButton: {
    position: 'absolute',
    top: 90, // Même niveau que le toggle
    left: 16, // Position en haut à gauche
    width: 50,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  // Styles pour le menu slide
  slideMenuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0, // Va jusqu'en bas de l'écran sous la tab bar
    width: '85%', // Encore plus large
    zIndex: 2000,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1500,
  },
});

export default MapScreen;