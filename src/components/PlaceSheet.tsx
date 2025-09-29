import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
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
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[
        styles.container,
        animatedStyle
      ]}>
        <View style={styles.header} pointerEvents="box-none">
          <Text style={styles.headerTitle} numberOfLines={1}>{selectedPlace.name}</Text>
          <TouchableOpacity
            style={styles.closeTopButton}
            onPress={() => setSelectedPlace(null)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.closeTopButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.contentArea}>
          <Text>Contenu…</Text>
        </View>
      </Animated.View>
    </GestureDetector>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    paddingHorizontal: 16,
    paddingTop: 12,
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
    marginLeft: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  closeTopButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  contentArea: {
    marginTop: 56,
    padding: 16,
    flex: 1,
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