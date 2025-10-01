import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Map, Users, Coffee, Navigation, Globe, User } from 'react-native-feather';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { PlaceProvider, usePlace } from './src/contexts/PlaceContext';
import LoginScreen from './src/screens/LoginScreen';
import MapScreen from './src/screens/MapScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import FriendsScreen from './src/screens/FriendsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const queryClient = new QueryClient();

// Les écrans sont maintenant importés depuis src/screens/

// Stack Navigator pour Matcha Crew (avec navigation vers Profil)
function MatchaCrewStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: true,
        headerTitle: 'Matcha Crew',
        headerTitleStyle: {
          fontSize: 28,
          fontWeight: 'bold',
          color: '#7da06b',
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
          height: 100,
        },
        headerTintColor: '#7da06b',
      }}
    >
      <Stack.Screen 
        name="Friends" 
        component={FriendsScreen}
        options={{
          headerTitle: 'Matcha Crew',
        }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          headerTitle: 'Mon Profil',
          headerBackTitle: '',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
}

// Composant pour l'app principale (après authentification)
function MainApp() {
  const { user, loading } = useAuth();
  const { selectedPlace } = usePlace();

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
      {/* Bouton central matcha */}
      {!selectedPlace && (
        <View style={styles.centralButton}>
          <TouchableOpacity style={styles.matchaButton}>
            <Coffee size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
      
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: selectedPlace ? { display: 'none' } : {
            backgroundColor: 'rgba(255, 255, 255, 0.9)', // Blanc transparent avec rgba
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
            height: 102, // Hauteur x1.7 plus grande (60 * 1.7 = 102)
            position: 'absolute', // Flotte au-dessus de la map
            bottom: 0,
            left: 0,
            right: 0,
            borderTopLeftRadius: 20, // Arrondi en haut à gauche
            borderTopRightRadius: 20, // Arrondi en haut à droite
          },
          tabBarActiveTintColor: '#8B4513',
          tabBarInactiveTintColor: '#A0522D',
        }}
      >
        <Tab.Screen 
          name="Map" 
          component={MapScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <View style={[styles.tabIcon, focused && styles.activeTab]}>
                <Map 
                  size={24} 
                  color={focused ? '#F6B7C0' : '#8B8B8B'} 
                />
              </View>
            ),
            tabBarLabel: ({ focused }) => (
              <Text style={[styles.tabLabel, { color: focused ? '#F6B7C0' : '#8B8B8B' }]}>Map</Text>
            ),
          }}
        />
        <Tab.Screen 
          name="Matcha Crew" 
          component={MatchaCrewStack}
          options={{
            headerShown: false,
            header: () => null,
            headerTitle: '',
            tabBarIcon: ({ focused }) => (
              <View style={[styles.tabIcon, focused && styles.activeTab]}>
                <Users 
                  size={24} 
                  color={focused ? '#F6B7C0' : '#8B8B8B'} 
                />
              </View>
            ),
            tabBarLabel: ({ focused }) => (
              <Text style={[styles.tabLabel, { color: focused ? '#F6B7C0' : '#8B8B8B' }]}>Matcha Crew</Text>
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PlaceProvider>
            <MainApp />
          </PlaceProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
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
  // Styles pour les nouveaux boutons modernes
  tabIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25, // Descend les icônes à 45px du haut
    marginBottom: 8, // Espace entre icône et texte
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10, // Descend encore plus le texte
  },
  // Styles pour le bouton central matcha
  centralButton: {
    position: 'absolute',
    bottom: 60, // Position au-dessus de la section
    left: '50%',
    marginLeft: -30, // Centre le bouton (60px / 2)
    zIndex: 1000, // Au-dessus de tout
  },
  matchaButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7da06b', // Vert du bouton "Réagir"
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    paddingTop: 2, // Monte le logo
  },
});