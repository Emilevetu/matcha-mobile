import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Camera, Edit3, User, Mail } from 'react-native-feather';

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const [username, setUsername] = useState('matcha_lover_23');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [profileImage, setProfileImage] = useState('https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face');

  const handleSignOut = async () => {
    await signOut();
  };

  const handleEditUsername = () => {
    setIsEditingUsername(!isEditingUsername);
  };

  const handleSaveUsername = () => {
    setIsEditingUsername(false);
    // Ici on sauvegarderait le username en base
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Instagramable */}
      <View style={styles.header}>
        <Text style={styles.title}>Mon Profil</Text>
        <Text style={styles.subtitle}>Matcha Crew</Text>
      </View>

      {/* Photo de profil avec effet Instagram */}
      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          <Image 
            source={{ uri: profileImage }} 
            style={styles.profileImage}
          />
          <TouchableOpacity style={styles.cameraButton}>
            <Camera size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        {/* Username avec édition */}
        <View style={styles.usernameSection}>
          {isEditingUsername ? (
            <View style={styles.editUsernameContainer}>
              <TextInput
                style={styles.usernameInput}
                value={username}
                onChangeText={setUsername}
                autoFocus
              />
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSaveUsername}
              >
                <Text style={styles.saveButtonText}>✓</Text>
              </TouchableOpacity>
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
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
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
  usernameInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    minWidth: 150,
    textAlign: 'center',
  },
  saveButton: {
    marginLeft: 8,
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