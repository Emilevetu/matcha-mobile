import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getTop5SpotsByHeartEyes, SpotReactionCount } from '../services/reactionsService';

interface SlideMenuScreenProps {
  onClose: () => void;
}

const SlideMenuScreen = ({ onClose }: SlideMenuScreenProps) => {
  // ✅ OPTIMISATION : Utilisation de React Query avec cache
  const { data: top5Spots = [], isLoading: loading, error } = useQuery({
    queryKey: ['top5SpotsByHeartEyes'],
    queryFn: getTop5SpotsByHeartEyes,
    // ✅ Cache réduit pour mise à jour plus fréquente
    staleTime: 30 * 1000, // 30 secondes seulement
    cacheTime: 2 * 60 * 1000, // 2 minutes
  });

  if (error) {
    console.error('❌ Erreur lors du chargement du classement:', error);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
            <View style={styles.header}>
              <Text style={styles.title}>Top 5 Spots</Text>
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
                      <Text style={styles.heartEyesEmoji}>😍</Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6B7C0', // Rose pâle
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
    color: '#333333',
    marginBottom: 5,
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
  },
  spotItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 15,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rankContainer: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  spotInfo: {
    flex: 1,
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
});

export default SlideMenuScreen;
