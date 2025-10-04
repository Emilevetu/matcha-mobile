import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ScrollView,
  Linking,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MapPin, Clock, Heart, Bookmark, Share, X, Users } from 'react-native-feather';
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
import { usePlaceStats } from '../hooks/usePlaceStats';
import { usePlaceBadges } from '../hooks/usePlaceBadges';
import { BadgeSelector } from './BadgeSelector';

const { height: screenHeight } = Dimensions.get('window');
const HALF_HEIGHT = Math.round(screenHeight * 0.5);
const MAX_HEIGHT = Math.round(screenHeight * 0.92); // compromis: quasi plein écran mais hint de carte visible
const MIN_HEIGHT = 0; // pour suivre le doigt jusqu'à la fermeture

export const PlaceSheet: React.FC = () => {
  const { selectedPlace, setSelectedPlace } = usePlace();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showReactionSheet, setShowReactionSheet] = useState(false);
  const [showBadgeSelector, setShowBadgeSelector] = useState(false);
  const [showLocationOptions, setShowLocationOptions] = useState(false);
  const { data: placeStats, isLoading: isLoadingStats } = usePlaceStats(selectedPlace?.id || '');
  const { data: placeBadges, isLoading: isLoadingBadges } = usePlaceBadges(selectedPlace?.id || '');

  // Fonction pour ouvrir la fenêtre de sélection
  const openLocationOptions = () => {
    setShowLocationOptions(true);
  };

  // Fonction pour ouvrir Plans avec l'adresse
  const openInAppleMaps = () => {
    if (selectedPlace?.address) {
      const encodedAddress = encodeURIComponent(selectedPlace.address);
      const mapsUrl = `http://maps.apple.com/?q=${encodedAddress}`;
      Linking.openURL(mapsUrl);
    }
    setShowLocationOptions(false);
  };

  // Fonction pour ouvrir Google Maps avec l'adresse
  const openInGoogleMaps = () => {
    if (selectedPlace?.address) {
      const encodedAddress = encodeURIComponent(selectedPlace.address);
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      Linking.openURL(mapsUrl);
    }
    setShowLocationOptions(false);
  };

  // Fonction pour copier l'adresse
  const copyAddress = async () => {
    if (selectedPlace?.address) {
      try {
        await Clipboard.setStringAsync(selectedPlace.address);
        alert('Adresse copiée !');
      } catch (error) {
        console.error('Erreur lors de la copie:', error);
        alert('Erreur lors de la copie');
      }
    }
    setShowLocationOptions(false);
  };

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
            {/* Avatar du lieu */}
            {selectedPlace.photos && (
              <View style={styles.avatarContainer}>
                <Image 
                  source={{ uri: selectedPlace.photos.split('|')[0] }}
                  style={styles.placeAvatar}
                  resizeMode="cover"
                />
              </View>
            )}
            
            {/* Titre du lieu */}
            <Text style={styles.headerTitle} numberOfLines={1}>{selectedPlace.name}</Text>
            
            {/* Bouton fermer */}
            <TouchableOpacity
              style={styles.closeTopButton}
              onPress={() => setSelectedPlace(null)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color="#7da06b" />
            </TouchableOpacity>
          </View>
          
          {/* Zone de drag invisible pour toute la surface en mi-screen */}
          {!isFullScreen && (
            <TouchableOpacity 
              style={styles.fullDragArea}
              activeOpacity={1}
              onPress={() => {}} // Pas d'action, juste pour capturer les touches
            />
          )}
          <ScrollView 
            style={styles.contentArea} 
            showsVerticalScrollIndicator={false}
            scrollEnabled={isFullScreen}
          >
            
            {/* Badges du lieu */}
            <View style={styles.badgesSection}>
              {/* Section Badges Communauté */}
              <View style={styles.badgesSubSection}>
                <Text style={styles.sectionTitle}>Badges Communauté</Text>
                {!isLoadingBadges && placeBadges && placeBadges.topBadges.length > 0 ? (
                  <View style={styles.badgesContainer}>
                    {placeBadges.topBadges.map((badge, index) => (
                      <View
                        key={badge.badge_id}
                        style={[
                          styles.badge,
                          { backgroundColor: badge.badge_color }
                        ]}
                      >
                        <Text style={styles.badgeText}>{badge.badge_name}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.noBadgesContainer}>
                    <View style={styles.noBadgesBadge}>
                      <Text style={styles.noBadgesText}>Pas encore de détails</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Section Badges Personnels */}
              <View style={styles.badgesSubSection}>
                <Text style={styles.sectionTitle}>Mes Badges</Text>
                {!isLoadingBadges && placeBadges && placeBadges.userBadges.length > 0 ? (
                  <View style={styles.badgesContainer}>
                    {placeBadges.userBadges.map((userBadge, index) => (
                      <View
                        key={userBadge.id}
                        style={[
                          styles.badge,
                          { backgroundColor: userBadge.badge.color }
                        ]}
                      >
                        <Text style={styles.badgeText}>{userBadge.badge.name}</Text>
                      </View>
                    ))}
                    <TouchableOpacity
                      style={styles.addBadgeButton}
                      onPress={() => setShowBadgeSelector(true)}
                    >
                      <Text style={styles.addBadgeText}>+</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.noBadgesContainer}>
                    <TouchableOpacity
                      style={styles.addBadgeButtonLong}
                      onPress={() => setShowBadgeSelector(true)}
                    >
                      <Text style={styles.addBadgeTextLong}>Ajoute tes badges</Text>
                    </TouchableOpacity>
              </View>
            )}
              </View>
            </View>
            
            {/* Informations du lieu */}
            <View style={styles.infoSection}>
              {/* Adresse */}
              <TouchableOpacity style={styles.infoRow} onPress={openLocationOptions}>
                <MapPin size={20} color="#7da06b" />
                <Text style={[styles.infoText, styles.clickableText]}>{selectedPlace.address}</Text>
              </TouchableOpacity>
              
              {/* Horaires */}
              {selectedPlace.hours && (
                <View style={styles.infoRow}>
                  <Clock size={20} color="#7da06b" />
                  <Text style={styles.infoText}>{selectedPlace.hours}</Text>
                </View>
              )}

              {/* Statistiques du lieu */}
              {!isLoadingStats && placeStats && (
                <View style={styles.infoRow}>
                  <Users size={20} color="#7da06b" />
                  <Text style={styles.infoText}>
                    {placeStats.totalInteractions.toLocaleString('fr-FR')} personnes sont allées boire ce matcha
                  </Text>
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
        placeId={selectedPlace.id}
      />

      {/* BadgeSelector modal */}
      {showBadgeSelector && (
        <BadgeSelector
          visible={showBadgeSelector}
          onClose={() => setShowBadgeSelector(false)}
          placeId={selectedPlace.id}
          userBadges={placeBadges?.userBadges.map(b => b.badge_id) || []}
          onBadgeAdded={() => {
            // Refresh automatique via le hook usePlaceBadges
            console.log('Badge ajouté, refresh automatique');
          }}
        />
      )}

      {/* Fenêtre de sélection de navigation */}
      {showLocationOptions && (
        <TouchableOpacity 
          style={styles.locationOptionsOverlay}
          onPress={() => setShowLocationOptions(false)}
          activeOpacity={1}
        >
          <TouchableOpacity 
            style={styles.locationOptionsContainer}
            onPress={() => {}} // Empêche la fermeture quand on clique sur le container
            activeOpacity={1}
          >
            <Text style={styles.locationOptionsTitle}>Y aller</Text>
            
            <TouchableOpacity style={styles.locationOption} onPress={openInAppleMaps}>
              <View style={styles.locationOptionIcon}>
                <Image 
                  source={require('../../assets/apple-maps-icon.png')} 
                  style={styles.mapsIcon}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.locationOptionText}>Ouvrir dans Plans</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.locationOption} onPress={openInGoogleMaps}>
              <View style={styles.locationOptionIcon}>
                <Image 
                  source={require('../../assets/google-maps-icon.png')} 
                  style={styles.mapsIcon}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.locationOptionText}>Ouvrir dans Google Maps</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.locationOption} onPress={copyAddress}>
              <View style={styles.locationOptionIcon}>
                <Image 
                  source={require('../../assets/copy-icon.png')} 
                  style={styles.mapsIcon}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.locationOptionText}>Copier l'adresse</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
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
    backgroundColor: 'white',
  },
  avatarContainer: {
    width: 54, // 60 * 0.9
    height: 54, // 60 * 0.9
    borderRadius: 27, // 30 * 0.9
    borderWidth: 3,
    borderColor: '#7da06b',
    marginRight: 12,
    overflow: 'hidden',
  },
  placeAvatar: {
    width: '100%',
    height: '100%',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    marginRight: 12,
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
  badgesSection: {
    marginBottom: 20,
    marginTop: 8,
  },
  badgesSubSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7da06b',
    marginBottom: 8,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  addBadgeButton: {
    width: 32,
    height: 24,
    borderRadius: 16,
    backgroundColor: '#7da06b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  addBadgeButtonLong: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#7da06b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBadgeTextLong: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  noBadgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  noBadgesBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#D0D0D0',
  },
  noBadgesText: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '500',
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
  clickableText: {
    color: '#7da06b',
    textDecorationLine: 'underline',
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
  fullDragArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  // Styles pour la fenêtre de sélection de navigation
  locationOptionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 2000,
  },
  locationOptionsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    minHeight: 300,
  },
  locationOptionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 20,
    textAlign: 'center',
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
  },
  locationOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mapsIcon: {
    width: 24,
    height: 24,
  },
  locationOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    flex: 1,
  },
});