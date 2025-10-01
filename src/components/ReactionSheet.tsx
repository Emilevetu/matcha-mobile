import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Image,
  Keyboard,
} from 'react-native';
import { X, Send, Camera, MessageCircle } from 'react-native-feather';
import { UploadService } from '../services/uploadService';
import { ReactionsService, ReactionData } from '../services/reactionsService';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
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
  placeId: string;
}

export const ReactionSheet: React.FC<ReactionSheetProps> = ({
  isVisible,
  onClose,
  placeName,
  placeId,
}) => {
  const { user } = useAuth();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const context = useSharedValue({ y: 0 });
  
  // États pour la réaction
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string>('https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face');
  
  // État pour le pop-up
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // États pour le layer flottant
  const [showFloatingInput, setShowFloatingInput] = useState(false);
  const [floatingText, setFloatingText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Détection du clavier
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      setShowFloatingInput(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Charger l'avatar de l'utilisateur
  React.useEffect(() => {
    const loadUserAvatar = async () => {
      if (!user) return;
      
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('user_id', user.id)
          .single();
        
        if (profile?.avatar_url) {
          setUserAvatar(profile.avatar_url);
        }
      } catch (error) {
        console.log('Avatar par défaut utilisé');
      }
    };
    
    loadUserAvatar();
  }, [user]);

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

  // Fonctions pour gérer les réactions
  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(selectedEmoji === emoji ? null : emoji);
  };

  const handlePhotoUpload = async () => {
    if (!user) return;
    
    setIsUploading(true);
    try {
      const result = await UploadService.uploadReaction(user.id, placeId);
      if (result.success && result.url) {
        setSelectedPhoto(result.url);
        // Pas de notification Apple - le texte s'adapte automatiquement
      } else {
        console.error('❌ Erreur upload photo:', result.error);
      }
    } catch (error) {
      console.error('❌ Erreur upload photo:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendReaction = async () => {
    if (!user) return;
    
    // Vérifier qu'il y a au moins une réaction
    if (!selectedEmoji && !selectedPhoto && !comment.trim()) {
      showToastMessage('Ajoute au moins une réaction !');
      return;
    }
    
    setIsSending(true);
    try {
      const reactionData: ReactionData = {
        emoji: selectedEmoji || undefined,
        photo: selectedPhoto || undefined,
        caption: comment.trim() || undefined,
        comment: comment.trim() || undefined
      };
      
      const result = await ReactionsService.sendReaction(user.id, placeId, reactionData);
      
      if (result.success) {
        showToastMessage('Réaction envoyée !');
        // Reset et fermer
        setSelectedEmoji(null);
        setSelectedPhoto(null);
        setComment('');
        onClose();
      } else {
        showToastMessage(result.error || 'Impossible d\'envoyer la réaction');
      }
    } catch (error) {
      showToastMessage('Impossible d\'envoyer la réaction');
    } finally {
      setIsSending(false);
    }
  };

  const hasContent = selectedEmoji || selectedPhoto || comment.trim();
  const canSend = hasContent && !isSending && !isUploading;

  // Fonction pour afficher le toast
  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Gestion du focus du TextInput
  const handleTextInputFocus = () => {
    setShowFloatingInput(true);
    setFloatingText(comment);
  };

  const handleFloatingTextChange = (text: string) => {
    setFloatingText(text);
    setComment(text);
  };

  const handleFloatingBlur = () => {
    setShowFloatingInput(false);
  };

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
            <Text style={styles.question}>Il était comment ce matcha ?</Text>
            
            {/* Avatar Instagram Style */}
            <View style={styles.instagramSection}>
              <TouchableOpacity 
                style={styles.avatarContainer}
                onPress={handlePhotoUpload}
                disabled={isUploading}
              >
                <View style={styles.avatarWrapper}>
                  <Image 
                    source={{ uri: selectedPhoto || userAvatar }} 
                    style={styles.avatarImage}
                  />
                  {!selectedPhoto && (
                    <View style={styles.addIconContainer}>
                      <Text style={styles.addIcon}>+</Text>
                    </View>
                  )}
                  
                  {/* Bouton supprimer - Style Instagram Stories */}
                  {selectedPhoto && (
                    <TouchableOpacity 
                      style={styles.removePhotoButton}
                      onPress={() => setSelectedPhoto(null)}
                    >
                      <X size={8} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.avatarText}>
                  {selectedPhoto ? 'Belle photo !' : 'Ajoute une photo !'}
                </Text>
              </TouchableOpacity>
            </View>
            
            
            {/* 3 boutons de réaction */}
            <View style={styles.reactionsContainer}>
              <TouchableOpacity 
                style={[styles.reactionButton, selectedEmoji === '😞' && styles.reactionButtonActive]}
                onPress={() => handleEmojiSelect('😞')}
              >
                <Text style={styles.reactionEmoji}>😞</Text>
                <Text style={styles.reactionText}>Pas bien</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.reactionButton, selectedEmoji === '😐' && styles.reactionButtonActive]}
                onPress={() => handleEmojiSelect('😐')}
              >
                <Text style={styles.reactionEmoji}>😐</Text>
                <Text style={styles.reactionText}>Correct</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.reactionButton, selectedEmoji === '😍' && styles.reactionButtonActive]}
                onPress={() => handleEmojiSelect('😍')}
              >
                <Text style={styles.reactionEmoji}>😍</Text>
                <Text style={styles.reactionText}>Excellent</Text>
              </TouchableOpacity>
            </View>
            
            {/* Zone de commentaire Instagram-like */}
            <View style={styles.commentSection}>
                  <TextInput
                    style={styles.commentInput}
                    value={comment}
                    onChangeText={setComment}
                    placeholder="Ajoute un message..."
                    placeholderTextColor="#999"
                    maxLength={50}
                    multiline={false}
                    returnKeyType="done"
                    onFocus={handleTextInputFocus}
                  />
              <Text style={styles.characterCount}>{comment.length}/50</Text>
            </View>
            
            {/* Bouton Envoyer - Instagramable */}
            <View style={styles.sendSection}>
              <TouchableOpacity 
                style={[styles.sendButton, canSend && styles.sendButtonActive]}
                onPress={handleSendReaction}
                disabled={!canSend}
              >
                <Send size={20} color={canSend ? "#FFFFFF" : "#999"} />
                <Text style={[styles.sendButtonText, canSend && styles.sendButtonTextActive]}>
                  {isSending ? 'Envoi...' : 'Envoyer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
      
      {/* Toast Instagram-like */}
      {showToast && (
        <View style={styles.toastContainer}>
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </View>
      )}
      
      {/* Layer flottant pour le clavier */}
      {showFloatingInput && (
        <Animated.View 
          style={[
            styles.floatingInputContainer,
            {
              bottom: keyboardHeight + 20,
            }
          ]}
        >
          <View style={styles.floatingInputWrapper}>
            <TextInput
              style={styles.floatingInput}
              value={floatingText}
              onChangeText={handleFloatingTextChange}
              placeholder="Ajoute un message..."
              placeholderTextColor="#999"
              maxLength={50}
              multiline={false}
              returnKeyType="done"
              onBlur={handleFloatingBlur}
              autoFocus={true}
            />
            <Text style={styles.floatingCharacterCount}>{floatingText.length}/50</Text>
          </View>
        </Animated.View>
      )}
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
    maxHeight: SCREEN_HEIGHT * 0.9,
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
    paddingHorizontal: 10,
    paddingVertical: 20,
    alignItems: 'stretch', // Permet aux enfants de prendre toute la largeur
    paddingBottom: 20,
    flex: 1,
    position: 'relative',
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  addContentSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    justifyContent: 'center',
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7da06b',
  },
  addButtonActive: {
    backgroundColor: '#7da06b',
  },
  addButtonTextActive: {
    color: '#FFFFFF',
  },
  // Styles Instagram
  instagramSection: {
    alignItems: 'center',
    marginVertical: 20,
    position: 'relative',
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#7da06b',
  },
  addIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#7da06b',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  avatarText: {
    fontSize: 14,
    color: '#7da06b',
    fontWeight: '500',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 10,
  },
  selectedPhotoContainer: {
    position: 'relative',
    marginVertical: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentSection: {
    marginVertical: 16,
  },
  commentInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  commentCounter: {
    textAlign: 'right',
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  reactionButtonActive: {
    backgroundColor: '#7da06b',
    borderColor: '#7da06b',
  },
  sendSection: {
    marginTop: 8, // Réduit l'écart entre la zone de texte et le bouton
    alignItems: 'center', // Centre le bouton
    paddingBottom: 8,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  sendButtonActive: {
    backgroundColor: '#7da06b',
    shadowColor: '#7da06b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  sendButtonTextActive: {
    color: '#FFFFFF',
  },
  // Styles pour la zone de commentaire
  commentSection: {
    marginTop: 16,
    marginBottom: 8, // Réduit l'écart avec le bouton Envoyer
    paddingHorizontal: 35, // Réduction très légère de la largeur
  },
  commentInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlignVertical: 'center',
    width: '100%',
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  // Styles pour le toast Instagram-like
  toastContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 1001,
  },
  toast: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: '80%',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Styles pour le layer flottant
  floatingInputContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 1002,
  },
  floatingInputWrapper: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  floatingInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  floatingCharacterCount: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 8,
    opacity: 0.7,
  },
  reactionsContainer: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    marginVertical: 16,
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
