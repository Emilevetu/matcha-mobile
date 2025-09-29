import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { Camera, Edit3, User, Mail, ArrowLeft, Check, X } from 'react-native-feather';
import { supabase, Profile } from '../services/supabase';
import { UploadService } from '../services/uploadService';
import { UsernameValidator, UsernameValidationResult } from '../services/usernameValidation';

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const navigation = useNavigation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [profileImage, setProfileImage] = useState('https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // États pour la validation username
  const [usernameValidation, setUsernameValidation] = useState<UsernameValidationResult>({ isValid: true });
  const [isValidatingUsername, setIsValidatingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Charger le profil utilisateur
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Erreur lors du chargement du profil:', error);
          return;
        }

        if (data) {
          setProfile(data);
          setUsername(data.username);
          if (data.avatar_url) {
            setProfileImage(data.avatar_url);
          }
        }
      } catch (err) {
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleEditUsername = () => {
    setIsEditingUsername(true);
    setUsernameError(null);
  };

  // Validation en temps réel du username
  const validateUsername = async (value: string) => {
    if (!value.trim()) {
      setUsernameError(null);
      setUsernameValidation({ isValid: true });
      return;
    }

    setIsValidatingUsername(true);
    setUsernameError(null);

    try {
      const validation = await UsernameValidator.validateComplete(value, user?.id);
      setUsernameValidation(validation);
      
      if (!validation.isValid) {
        setUsernameError(validation.error || 'Nom d\'utilisateur invalide');
      }
    } catch (error) {
      console.error('❌ Erreur validation username:', error);
      setUsernameError('Erreur lors de la validation');
    } finally {
      setIsValidatingUsername(false);
    }
  };

  // Handler pour le changement de username avec validation
  const handleUsernameChange = (value: string) => {
    // Laisser l'utilisateur taper librement
    setUsername(value);
    
    // Délai pour éviter trop de requêtes
    const timeoutId = setTimeout(() => {
      validateUsername(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleSaveUsername = async () => {
    if (!user || !profile) return;

    // Vérifier que le username n'est pas vide
    if (!username.trim()) {
      Alert.alert('Erreur', 'Le nom d\'utilisateur ne peut pas être vide');
      return;
    }

    // Vérifier la validation avant de sauvegarder
    if (!usernameValidation.isValid) {
      Alert.alert('Erreur', usernameError || 'Nom d\'utilisateur invalide');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim() })
        .eq('user_id', user.id);

      if (error) {
        Alert.alert('Erreur', 'Ce nom d\'utilisateur est déjà pris');
        return;
      }

      setProfile({ ...profile, username: username.trim() });
      setIsEditingUsername(false);
      setUsernameError(null);
      Alert.alert('Succès', 'Nom d\'utilisateur mis à jour !');
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de sauvegarder');
    }
  };

  const handleCancelEdit = () => {
    // Restaurer l'ancien username
    setUsername(profile?.username || '');
    setIsEditingUsername(false);
    setUsernameError(null);
    setUsernameValidation({ isValid: true });
  };

  // Fonction pour changer l'avatar avec ImageKit
  const pickImage = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Utilisateur non connecté');
      return;
    }

    try {
      console.log('📸 Début changement avatar pour user:', user.id);
      setUploading(true);

      // Utiliser le service ImageKit
      const result = await UploadService.uploadAvatar(user.id);
      
      if (result.success && result.url) {
        console.log('✅ Avatar uploadé avec succès:', result.url);
        
        // Mettre à jour l'état local
        setProfileImage(result.url);
        if (profile) {
          setProfile({ ...profile, avatar_url: result.url });
        }
        
        Alert.alert('Succès', 'Photo de profil mise à jour !');
      } else {
        console.error('❌ Échec upload avatar:', result.error);
        Alert.alert('Erreur', result.error || 'Impossible d\'uploader l\'image');
      }
      
    } catch (error) {
      console.error('❌ Erreur upload avatar:', error);
      Alert.alert('Erreur', 'Impossible d\'uploader l\'image');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Chargement du profil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Instagramable */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color="#7da06b" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Mon Profil</Text>
          <Text style={styles.subtitle}>Matcha Crew</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Photo de profil avec effet Instagram */}
      <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              <Image 
                source={{ uri: UploadService.getOptimizedImageUrl(profileImage, 'avatar') }} 
                style={styles.profileImage}
              />
          {uploading ? (
            <View style={styles.uploadingButton}>
              <ActivityIndicator size="small" color="#FFFFFF" />
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.cameraButton}
              onPress={pickImage}
              disabled={uploading}
            >
              <Camera size={16} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Username avec édition et validation */}
        <View style={styles.usernameSection}>
          {isEditingUsername ? (
            <View style={styles.editUsernameContainer}>
              <TextInput
                style={[
                  styles.usernameInput,
                  usernameError && styles.usernameInputError
                ]}
                value={username}
                onChangeText={handleUsernameChange}
                autoFocus
                placeholder="Nom d'utilisateur"
                placeholderTextColor="#999"
                returnKeyType="done"
                onSubmitEditing={handleSaveUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
              
              {/* Indicateur de validation */}
              <View style={styles.validationIndicator}>
                {isValidatingUsername ? (
                  <ActivityIndicator size="small" color="#7da06b" />
                ) : usernameValidation.isValid && username.trim() ? (
                  <Check size={16} color="#4CAF50" />
                ) : usernameError ? (
                  <X size={16} color="#F44336" />
                ) : null}
              </View>
              
              <View style={styles.editButtonsContainer}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={handleCancelEdit}
                >
                  <Text style={styles.cancelButtonText}>✕</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.saveButton,
                    (!usernameValidation.isValid || isValidatingUsername) && styles.saveButtonDisabled
                  ]}
                  onPress={handleSaveUsername}
                  disabled={!usernameValidation.isValid || isValidatingUsername}
                >
                  <Text style={styles.saveButtonText}>✓</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.usernameDisplay}>
              <Text style={styles.usernameText}>@{username}</Text>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={handleEditUsername}
              >
                <Edit3 size={16} color="#7da06b" />
              </TouchableOpacity>
            </View>
          )}
          
          {/* Message d'erreur */}
          {usernameError && (
            <Text style={styles.errorText}>{usernameError}</Text>
          )}
          
          {/* Suggestions si username invalide */}
          {usernameError && username.trim() && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Suggestions :</Text>
              {UsernameValidator.generateSuggestions(username).map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionButton}
                  onPress={() => setUsername(suggestion)}
                >
                  <Text style={styles.suggestionText}>@{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Stats Instagramables */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Lieux visités</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Réactions</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Photos partagées</Text>
          </View>
        </View>
      </View>

      {/* Informations utilisateur */}
      {user && (
        <View style={styles.userInfoSection}>
          <View style={styles.infoItem}>
            <Mail size={20} color="#7da06b" />
            <Text style={styles.infoText}>{user.email}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <User size={20} color="#7da06b" />
            <Text style={styles.infoText}>Membre depuis 2024</Text>
          </View>
        </View>
      )}

      {/* Boutons d'action */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Modifier mes préférences</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Partager mon profil</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefdfb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7da06b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7A3A',
    fontWeight: '500',
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7da06b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  uploadingButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFA500',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  usernameSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  editUsernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  validationIndicator: {
    marginLeft: 8,
    width: 20,
    alignItems: 'center',
  },
  usernameInputError: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  saveButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  suggestionsContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  suggestionButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 12,
    color: '#7da06b',
    fontWeight: '500',
  },
  usernameInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  editButtonsContainer: {
    flexDirection: 'row',
    marginLeft: 8,
    gap: 8,
  },
  cancelButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#7da06b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  usernameDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernameText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginRight: 8,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7da06b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  userInfoSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 120, // Augmenté pour éviter que la barre de navigation cache le bouton
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  signOutButton: {
    backgroundColor: '#F6B7C0',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signOutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ProfileScreen;