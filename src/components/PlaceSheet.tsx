import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import { MapPin, Clock, Heart, Bookmark, Share, X } from 'react-native-feather';
import { ReactionSheet } from './ReactionSheet';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { usePlace } from '../contexts/PlaceContext';

const { height: screenHeight } = Dimensions.get('window');
const HALF_HEIGHT = Math.round(screenHeight * 0.5);
const MAX_HEIGHT = Math.round(screenHeight * 0.92); // compromis: quasi plein écran mais hint de carte visible
const MIN_HEIGHT = 0; // pour suivre le doigt jusqu'à la fermeture

export const PlaceSheet: React.FC = () => {
  const { selectedPlace, setSelectedPlace } = usePlace();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showReactionSheet, setShowReactionSheet] = useState(false);

  // Debug log pour vérifier l'état
  React.useEffect(() => {
    console.log('🔧 PlaceSheet - showReactionSheet:', showReactionSheet);
  }, [showReactionSheet]);

  // Hauteur animée de la sheet
  const sheetHeight = useSharedValue(HALF_HEIGHT);
  const startHeight = useSharedValue(HALF_HEIGHT);
  
  // Force half screen when a new place is selected
  React.useEffect(() => {
    if (selectedPlace) {
      setIsFullScreen(false);
      sheetHeight.value = HALF_HEIGHT; // Reset à mi-écran
    }
  }, [selectedPlace]);
  
  // Style animé basé sur la hauteur
  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: sheetHeight.value,
    };
  });

  // Gesture handler - SUIVI DU DOIGT EN TEMPS RÉEL (animer la hauteur)
  const panGesture = Gesture.Pan()
    .enabled(!showReactionSheet) // Désactiver quand ReactionSheet est ouverte
    .onBegin(() => {
      startHeight.value = sheetHeight.value;
    })
    .onUpdate((event) => {
      // On augmente la hauteur en glissant vers le haut (translationY négative)
      const next = startHeight.value - event.translationY;
      // Toujours attaché au bas: hauteur clampée
      const clamped = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, next));
      sheetHeight.value = clamped;
    })
    .onEnd((event) => {
      const { translationY, velocityY } = event;

      // Seuils plus permissifs pour faciliter la descente
      const downIntent = translationY > 60 || velocityY > 400;
      const upIntent = translationY < -60 || velocityY < -400;

      // Si on était à mi-écran et geste vers le bas → suivre le doigt jusqu'à un seuil bas
      if (!isFullScreen && downIntent) {
        // Si la hauteur est bien descendue sous un seuil, on ferme, sinon on revient à mi-écran
        // 35% de l'écran => 0.35 * screenHeight
        // Or HALF_HEIGHT = 0.5 * screenHeight, donc multiplicateur = 0.35 / 0.5 = 0.7
        const closeThreshold = HALF_HEIGHT * 0.7;
        if (sheetHeight.value <= closeThreshold) {
          // Fermeture ULTRA-rapide, sans rebond
          sheetHeight.value = withTiming(MIN_HEIGHT, { duration: 100 }, (finished) => {
            if (finished) {
              runOnJS(setSelectedPlace)(null);
            }
          });
        } else {
          sheetHeight.value = withSpring(HALF_HEIGHT, {
            damping: 24,
            stiffness: 240,
            mass: 1,
            overshootClamping: false,
            restDisplacementThreshold: 0.5,
            restSpeedThreshold: 1,
            initialVelocity: -velocityY / 1000,
          });
        }
        return;
      }

      // Depuis plein écran: décider entre rester plein écran ou descendre à mi-écran
      if (isFullScreen) {
        const target = downIntent ? HALF_HEIGHT : MAX_HEIGHT;
        sheetHeight.value = withSpring(target, {
          damping: 24,
          stiffness: 240,
          mass: 1,
          overshootClamping: false,
          restDisplacementThreshold: 0.5,
          restSpeedThreshold: 1,
          initialVelocity: -velocityY / 1000,
        });
        runOnJS(setIsFullScreen)(target === MAX_HEIGHT);
        return;
      }

      // Sinon (mi-écran, geste vers le haut) → plein écran, sinon rester mi-écran
      const target = upIntent ? MAX_HEIGHT : HALF_HEIGHT;
      sheetHeight.value = withSpring(target, {
        damping: 24,
        stiffness: 240,
        mass: 1,
        overshootClamping: false,
        restDisplacementThreshold: 0.5,
        restSpeedThreshold: 1,
        initialVelocity: -velocityY / 1000,
      });
      runOnJS(setIsFullScreen)(target === MAX_HEIGHT);
    });
  
  if (!selectedPlace) {
    return null;
  }

  return (
    <>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[
          styles.container,
          animatedStyle
        ]}>
          {/* Barre de drag Google Maps style */}
          <View style={styles.dragHandle} />
          
          <View style={styles.header} pointerEvents="box-none">
            <Text style={styles.headerTitle} numberOfLines={1}>{selectedPlace.name}</Text>
            <TouchableOpacity
              style={styles.closeTopButton}
              onPress={() => setSelectedPlace(null)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color="#7da06b" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.contentArea} showsVerticalScrollIndicator={false}>
            {/* Image principale */}
            {selectedPlace.photos && (
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: selectedPlace.photos.split('|')[0] }}
                  style={styles.mainImage}
                  resizeMode="cover"
                />
              </View>
            )}
            
            {/* Informations du lieu */}
            <View style={styles.infoSection}>
              {/* Adresse */}
              <View style={styles.infoRow}>
                <MapPin size={20} color="#7da06b" />
                <Text style={styles.infoText}>{selectedPlace.address}</Text>
              </View>
              
              {/* Horaires */}
              {selectedPlace.hours && (
                <View style={styles.infoRow}>
                  <Clock size={20} color="#7da06b" />
                  <Text style={styles.infoText}>{selectedPlace.hours}</Text>
                </View>
              )}
            </View>
            
            {/* Boutons d'action */}
            <View style={styles.actionsSection}>
              <TouchableOpacity 
                style={styles.reactButton}
                onPress={() => setShowReactionSheet(true)}
              >
                <Heart size={20} color="#FFFFFF" />
                <Text style={styles.reactButtonText}>Réagir</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.saveButton}>
                <Bookmark size={20} color="#333333" />
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.shareButton}>
                <Share size={20} color="#333333" />
              </TouchableOpacity>
            </View>
            
            {/* Galerie */}
            {selectedPlace.photos && selectedPlace.photos.split('|').length > 1 && (
              <View style={styles.gallerySection}>
                <Text style={styles.galleryTitle}>Galerie</Text>
                <View style={styles.galleryGrid}>
                  {selectedPlace.photos.split('|').slice(1, 3).map((photoUrl, index) => (
                    <View key={index} style={styles.galleryItem}>
                      <Image 
                        source={{ uri: photoUrl }}
                        style={styles.galleryImage}
                        resizeMode="cover"
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </GestureDetector>
      
      {/* ReactionSheet overlay */}
      <ReactionSheet
        isVisible={showReactionSheet}
        onClose={() => setShowReactionSheet(false)}
        placeName={selectedPlace.name}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: HALF_HEIGHT, // Mi-écran par défaut
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    // Ombre Google Maps style
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8, // Android
  },
  dragHandle: {
    position: 'absolute',
    top: 8,
    left: '50%',
    marginLeft: -20,
    width: 40,
    height: 4,
    backgroundColor: '#C4C4C4',
    borderRadius: 2,
    zIndex: 10,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    paddingHorizontal: 16,
    paddingTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  closeTopButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F6B7C0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contentArea: {
    marginTop: 56,
    padding: 16,
    flex: 1,
  },
  imageContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mainImage: {
    width: '100%',
    height: 200,
  },
  infoSection: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  reactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7da06b',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
  },
  reactButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
  },
  saveButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 25,
  },
  gallerySection: {
    marginTop: 24,
  },
  galleryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
  },
  galleryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  galleryItem: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    maxWidth: '45%',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: 'red',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});