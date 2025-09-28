import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import MapScreen from './src/screens/MapScreen';
import SavedScreen from './src/screens/SavedScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const queryClient = new QueryClient();

// Les écrans sont maintenant importés depuis src/screens/

// Composant pour l'app principale (après authentification)
function MainApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B9A46" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: '#8B9A46',
          },
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: '#A8B85C',
        }}
      >
        <Tab.Screen 
          name="Carte" 
          component={MapScreen}
          options={{
            headerShown: false,
            tabBarIcon: () => <Text>🗺️</Text>,
          }}
        />
        <Tab.Screen 
          name="Favoris" 
          component={SavedScreen}
          options={{
            tabBarIcon: () => <Text>❤️</Text>,
          }}
        />
        <Tab.Screen 
          name="Profil" 
          component={ProfileScreen}
          options={{
            tabBarIcon: () => <Text>👤</Text>,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </QueryClientProvider>
  );
}

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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fefdfb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8B9A46',
  },
});