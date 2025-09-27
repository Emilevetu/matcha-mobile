import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const ProfileScreen = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profil</Text>
      <Text style={styles.subtitle}>Votre profil utilisateur</Text>
      
      {user && (
        <View style={styles.userInfo}>
          <Text style={styles.userEmail}>{user.email}</Text>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fefdfb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B9A46',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7A3A',
    marginBottom: 32,
  },
  userInfo: {
    alignItems: 'center',
  },
  userEmail: {
    fontSize: 16,
    color: '#5a4d3a',
    marginBottom: 16,
  },
  signOutButton: {
    backgroundColor: '#8B9A46',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;