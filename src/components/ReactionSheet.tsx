import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { X } from 'react-native-feather';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ReactionSheetProps {
  isVisible: boolean;
  onClose: () => void;
  placeName: string;
}

export const ReactionSheet: React.FC<ReactionSheetProps> = ({
  isVisible,
  onClose,
  placeName,
}) => {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const context = useSharedValue({ y: 0 });

  // Animation d'ouverture
  React.useEffect(() => {
    if (isVisible) {
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
      });
    } else {
      translateY.value = SCREEN_HEIGHT;
    }
  }, [isVisible]);

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = Math.max(0, context.value.y + event.translationY);
    })
    .onEnd(() => {
      const shouldClose = translateY.value > SCREEN_HEIGHT * 0.3;
      
      if (shouldClose) {
        translateY.value = withSpring(SCREEN_HEIGHT, {
          damping: 20,
          stiffness: 300,
        });
        // Fermer immédiatement sans attendre l'animation
        setTimeout(() => {
          runOnJS(onClose)();
        }, 100);
      } else {
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.container, animatedStyle]}>
          {/* Barre de drag */}
          <View style={styles.dragHandle} />
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{placeName}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                translateY.value = withSpring(SCREEN_HEIGHT, {
                  damping: 20,
                  stiffness: 300,
                });
                // Fermer immédiatement sans attendre l'animation
                setTimeout(() => {
                  onClose();
                }, 100);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color="#7da06b" />
            </TouchableOpacity>
          </View>

          {/* Contenu */}
          <View style={styles.content}>
            <Text style={styles.question}>Comment as-tu trouvé ton expérience ?</Text>
            
            {/* 3 boutons de réaction */}
            <View style={styles.reactionsContainer}>
              <TouchableOpacity style={styles.reactionButton}>
                <Text style={styles.reactionEmoji}>😞</Text>
                <Text style={styles.reactionText}>Pas bien</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.reactionButton}>
                <Text style={styles.reactionEmoji}>😐</Text>
                <Text style={styles.reactionText}>Correct</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.reactionButton}>
                <Text style={styles.reactionEmoji}>😍</Text>
                <Text style={styles.reactionText}>Excellent</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: SCREEN_HEIGHT * 0.4,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
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
  content: {
    padding: 20,
    alignItems: 'center',
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  reactionsContainer: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  reactionButton: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reactionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  reactionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});
