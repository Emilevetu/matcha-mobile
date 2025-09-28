import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

interface Place {
  name: string | null;
  address: string | null;
  hours: string | null;
  photos: string | null;
}

interface PlaceSheetProps {
  place: Place | null;
  onClose: () => void;
}

export const PlaceSheet: React.FC<PlaceSheetProps> = ({ place, onClose }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Force half screen when a new place is selected
  React.useEffect(() => {
    if (place) {
      setIsFullScreen(false);
    }
  }, [place]);
  
  if (!place) {
    return null;
  }

  // Parse photos from Supabase
  const photos = place.photos ? place.photos.split('|') : [];
  const firstPhoto = photos[0] || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop&crop=center';
  
  // Simple gesture handler
  const onGestureEvent = (event: any) => {
    const { translationY, state } = event.nativeEvent;
    
    if (state === State.END) {
      if (translationY < -50) {
        // Swipe up - go full screen
        setIsFullScreen(true);
      } else if (translationY > 50) {
        // Swipe down - go half screen
        setIsFullScreen(false);
      }
    }
  };

  return (
    <PanGestureHandler onHandlerStateChange={onGestureEvent}>
      <Animated.View style={[
        styles.container,
        isFullScreen ? styles.fullScreen : styles.halfScreen
      ]}>
      {/* Photo */}
      <Image 
        source={{ uri: firstPhoto }}
        style={styles.photo}
        resizeMode="cover"
      />
      
      <Text style={styles.title}>
        {place.name}
      </Text>
      
      {/* Adresse */}
      <Text style={styles.address}>
        📍 {place.address}
      </Text>
      
      {/* Horaires */}
      <Text style={styles.hours}>
        🕒 {place.hours}
      </Text>
      
      {/* Boutons d'action */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.reagirButton}>
          <Text style={styles.reagirButtonText}>Réagir</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.partagerButton}>
          <Text style={styles.partagerButtonText}>Partager</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={onClose}
      >
        <Text style={styles.closeButtonText}>Fermer</Text>
      </TouchableOpacity>
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  halfScreen: {
    height: 400,
  },
  fullScreen: {
    height: '90%',
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: 'bold',
  },
  address: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  hours: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  reagirButton: {
    backgroundColor: '#7da06b',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    flex: 1,
    marginRight: 10,
  },
  reagirButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  partagerButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#7da06b',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    flex: 1,
    marginLeft: 10,
  },
  partagerButtonText: {
    color: '#7da06b',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: 'red',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  closeButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});