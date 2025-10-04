import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView, TouchableOpacity, Modal, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getTop5SpotsByHeartEyes, SpotReactionCount } from '../services/reactionsService';
import { useUserSpots } from '../hooks/useUserSpots';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { Globe, User, X } from 'react-native-feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';

interface SlideMenuScreenProps {
  onClose: () => void;
}

const SlideMenuScreen = ({ onClose }: SlideMenuScreenProps) => {
  const [selectedFilter, setSelectedFilter] = useState<'globe' | 'user'>('globe');
  const [showAddSpotModal, setShowAddSpotModal] = useState(false);
  const [selectedSpots, setSelectedSpots] = useState<any[]>([]);
  const [showMaxSpotsAlert, setShowMaxSpotsAlert] = useState(false);
  const { user } = useAuth();

  // Charger les spots sauvegardés au montage du composant
  useEffect(() => {
    const loadSavedSpots = async () => {
      try {
        const savedSpots = await AsyncStorage.getItem('userSelectedSpots');
        if (savedSpots) {
          const parsedSpots = JSON.parse(savedSpots);
          setSelectedSpots(parsedSpots);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des spots sauvegardés:', error);
      }
    };

    loadSavedSpots();
  }, []);

  // Sauvegarder les spots à chaque modification
  useEffect(() => {
    const saveSpots = async () => {
      try {
        console.log('💾 Sauvegarde des spots:', selectedSpots.map((spot, idx) => `${idx + 1}. ${spot.name}`));
        await AsyncStorage.setItem('userSelectedSpots', JSON.stringify(selectedSpots));
        console.log('✅ Spots sauvegardés avec succès');
      } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde des spots:', error);
      }
    };

    if (selectedSpots.length > 0) {
      saveSpots();
    }
  }, [selectedSpots]);
  
  // ✅ OPTIMISATION : Utilisation de React Query avec cache
  const { data: top5Spots = [], isLoading: loading, error } = useQuery({
    queryKey: ['top5SpotsByHeartEyes'],
    queryFn: getTop5SpotsByHeartEyes,
    // ✅ Cache réduit pour mise à jour plus fréquente
    staleTime: 30 * 1000, // 30 secondes seulement
    cacheTime: 2 * 60 * 1000, // 2 minutes
  });

  // Récupérer les spots que l'utilisateur a aimés (même logique que le toggle personne seule)
  const { data: userLikedSpots = [], isLoading: loadingUserSpots } = useQuery({
    queryKey: ['userSpots', user?.id],
    queryFn: async () => {
      if (!user) {
        console.log('🔍 SlideMenuScreen - Pas d\'utilisateur connecté');
        return [];
      }

      console.log('🔍 SlideMenuScreen - Début de la requête Supabase...');
      
      try {
        // ÉTAPE 1: Récupérer les place_id où l'utilisateur a mis des réactions 😍
        const { data: userReactions, error: reactionsError } = await supabase
          .from('reactions')
          .select('place_id')
          .eq('user_id', user.id)
          .eq('emoji', '😍');

        if (reactionsError) {
          console.error('❌ SlideMenuScreen - Erreur réactions:', reactionsError);
          throw new Error(`Erreur lors du chargement des réactions utilisateur: ${reactionsError.message}`);
        }

        if (!userReactions || userReactions.length === 0) {
          console.log('💖 Aucune réaction 😍 trouvée pour cet utilisateur');
          return [];
        }

        // Extraire les place_id uniques
        const placeIds = [...new Set(userReactions.map(r => r.place_id))];
        console.log(`💖 ${placeIds.length} spots avec réactions 😍 trouvés`);

        // ÉTAPE 2: Récupérer les détails des places correspondantes
        const { data: places, error: placesError } = await supabase
          .from('places')
          .select('id, name, address, lat, lng, photos, hours')
          .in('id', placeIds)
          .not('lat', 'is', null)
          .not('lng', 'is', null);

        if (placesError) {
          console.error('❌ SlideMenuScreen - Erreur places:', placesError);
          throw new Error(`Erreur lors du chargement des places: ${placesError.message}`);
        }

        console.log('✅ SlideMenuScreen - Spots utilisateur:', places?.length || 0);
        return places || [];
      } catch (err) {
        console.error('💥 SlideMenuScreen - Exception:', err);
        throw err;
      }
    },
    enabled: !!user, // Seulement si l'utilisateur est connecté
    staleTime: 0, // Pas de cache - toujours frais
    cacheTime: 0, // Pas de cache - toujours frais
  });

  if (error) {
    console.error('❌ Erreur lors du chargement du classement:', error);
  }

  return (
    <SafeAreaView style={styles.container}>
      {selectedFilter === 'globe' ? (
        <>
                <ScrollView style={styles.scrollView}>
                  <View style={styles.header}>
                    <Text style={styles.title}>Top 5 spots de la semaine</Text>
                  </View>
          
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8B4513" />
                <Text style={styles.loadingText}>Chargement du classement...</Text>
              </View>
            ) : (
              <View style={styles.rankingContainer}>
                {top5Spots.length > 0 ? (
                  top5Spots.map((spot, index) => (
                    <View key={spot.placeId} style={styles.spotItem}>
                      <View style={styles.rankContainer}>
                        <Text style={styles.rank}>#{index + 1}</Text>
                      </View>
                      <View style={styles.spotInfo}>
                        <Text style={styles.spotName}>{spot.placeName}</Text>
                              <View style={styles.spotStats}>
                                <Text style={styles.reactionCount}>
                                  {spot.heartEyesCount} réaction{spot.heartEyesCount > 1 ? 's' : ''}
                                </Text>
                              </View>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Aucun spot trouvé</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </>
      ) : (
        /* Page rose pour la personne seule */
        <View style={styles.userPage}>
          <View style={styles.header}>
            <Text style={styles.title}>Top 5 Spots</Text>
          </View>

          <TouchableOpacity
            style={styles.addSpotButton}
            onPress={() => setShowAddSpotModal(true)}
          >
            <Text style={styles.addSpotButtonText}>Ajouter un spot</Text>
          </TouchableOpacity>

          {/* Liste des spots sélectionnés avec drag & drop */}
          {selectedSpots.length > 0 && (
            <View style={styles.selectedSpotsContainer}>
              <DraggableFlatList
                data={selectedSpots}
                onDragEnd={({ data }) => {
                  console.log('🔄 Drag & Drop - Nouvel ordre:', data.map((item, idx) => `${idx + 1}. ${item.name}`));
                  setSelectedSpots(data);
                }}
                keyExtractor={(item) => item.id}
                renderItem={(params) => {
                  const { item, index, drag, isActive } = params;
                  // Utiliser l'index du tableau selectedSpots comme fallback
                  const fallbackIndex = selectedSpots.findIndex(spot => spot.id === item.id);
                  const finalIndex = index !== undefined ? index : fallbackIndex;
                  const rankNumber = finalIndex + 1;
                  
                  console.log(`📍 Rendu spot ${rankNumber}: ${item.name} (index: ${index}, fallbackIndex: ${fallbackIndex})`);
                  
                  return (
                    <TouchableOpacity
                      style={[styles.spotItem, isActive && styles.spotItemActive]}
                      onLongPress={drag}
                      delayLongPress={200}
                    >
                      <View style={styles.rankContainer}>
                        <Text style={styles.rank}>#{rankNumber}</Text>
                      </View>
                      <View style={styles.spotInfo}>
                        <Text style={styles.spotName}>{item.name}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => {
                          setSelectedSpots(prev => prev.filter(s => s.id !== item.id));
                        }}
                      >
                        <X width={16} height={16} color="#FF6B6B" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          )}
        </View>
      )}
      
      {/* Toggle en bas avec même design que la map */}
      <View style={styles.toggleContainer}>
        <View style={styles.filterToggle}>
          <TouchableOpacity 
            style={[styles.filterButton, selectedFilter === 'globe' && styles.selectedFilter]}
            onPress={() => setSelectedFilter('globe')}
          >
            <Globe size={20} color={selectedFilter === 'globe' ? '#FFFFFF' : '#8B8B8B'} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, selectedFilter === 'user' && styles.selectedFilter]}
            onPress={() => setSelectedFilter('user')}
          >
            <User size={20} color={selectedFilter === 'user' ? '#FFFFFF' : '#8B8B8B'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal pour ajouter un spot */}
      <Modal
        visible={showAddSpotModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddSpotModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header du modal */}
            <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Mes spots favoris</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowAddSpotModal(false)}
              >
                <X width={20} height={20} color="#7da06b" />
              </TouchableOpacity>
            </View>

            {/* Liste des spots */}
            {loadingUserSpots ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color="#7da06b" />
                <Text style={styles.modalLoadingText}>Chargement...</Text>
              </View>
            ) : (
              <FlatList
                data={userLikedSpots}
                keyExtractor={(item) => item.id}
                style={styles.modalList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.modalSpotItem}
                    onPress={() => {
                      // Vérifier si on a déjà 5 spots sélectionnés
                      if (selectedSpots.length >= 5) {
                        // Afficher le message d'erreur
                        setShowMaxSpotsAlert(true);
                        // Fermer le modal
                        setShowAddSpotModal(false);
                        return;
                      }

                      // Ajouter le spot à la liste sélectionnée
                      setSelectedSpots(prev => {
                        // Vérifier si le spot n'est pas déjà sélectionné
                        if (prev.find(spot => spot.id === item.id)) {
                          return prev; // Ne pas ajouter de doublon
                        }
                        return [...prev, item];
                      });
                      // Fermer le modal
                      setShowAddSpotModal(false);
                    }}
                  >
                    <Text style={styles.modalSpotName}>{item.name}</Text>
                    <Text style={styles.modalSpotAddress}>{item.address}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.modalEmptyContainer}>
                    <Text style={styles.modalEmptyText}>Aucun spot aimé trouvé</Text>
                    <Text style={styles.modalEmptySubtext}>Réagissez avec 😍 sur des spots pour les voir ici</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal d'alerte pour la limite de 5 spots */}
      <Modal
        visible={showMaxSpotsAlert}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowMaxSpotsAlert(false)}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertContainer}>
            <Text style={styles.alertTitle}>Limite atteinte</Text>
            <Text style={styles.alertMessage}>
              Vous avez déjà sélectionné 5 spots dans votre classement. 
              Supprimez un spot pour en ajouter un nouveau.
            </Text>
            <TouchableOpacity 
              style={styles.alertButton}
              onPress={() => setShowMaxSpotsAlert(false)}
            >
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffe5e2', // Rose pâle
    width: '85%', // Encore plus large
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#8B4513',
    fontWeight: '500',
  },
  rankingContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: 140,
  },
  spotItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 15,
    marginVertical: 4,
    height: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  spotItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    transform: [{ scale: 1.02 }],
  },
  rankContainer: {
    width: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  spotInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  spotName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  spotStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heartEyesEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  reactionCount: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  // Styles pour le toggle (même design que la map)
  toggleContainer: {
    position: 'absolute',
    bottom: 120, // Au-dessus de la tab bar (qui fait ~102px)
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  filterToggle: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 2,
    height: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  selectedFilter: {
    backgroundColor: '#ffe5e2', // Rose pour la sélection
  },
  // Style pour la page de la personne seule
  userPage: {
    flex: 1,
    backgroundColor: '#ffe5e2', // Rose pâle
  },
  // Style pour le bouton "Ajouter un spot"
  addSpotButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addSpotButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7da06b',
    textAlign: 'center',
  },
  // Styles pour le modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffe5e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLoadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  modalLoadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7da06b',
    fontWeight: '500',
  },
  modalList: {
    maxHeight: 400,
  },
  modalSpotItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  modalSpotName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  modalSpotAddress: {
    fontSize: 14,
    color: '#666666',
  },
  modalEmptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  modalEmptySubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  // Styles pour les spots sélectionnés
  selectedSpotsContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  selectedSpotsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  // Styles pour le modal d'alerte
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  alertButton: {
    backgroundColor: '#7da06b',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default SlideMenuScreen;
