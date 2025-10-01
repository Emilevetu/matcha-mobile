import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { FriendsService, FriendWithProfile, FriendRequestWithProfile } from '../services/friendsService';
import { UploadService } from '../services/uploadService';
import { User, Search, UserPlus, Check, X, Users, Bell } from 'react-native-feather';

const FriendsScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequestWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Charger les amis et les demandes en parallèle
      const [friendsResult, requestsResult] = await Promise.all([
        FriendsService.getFriends(user.id),
        FriendsService.getFriendRequests(user.id)
      ]);

      if (friendsResult.success) {
        setFriends(friendsResult.data || []);
      }

      if (requestsResult.success) {
        setFriendRequests(requestsResult.data || []);
      }
    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSearch = async () => {
    if (!user || !searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const result = await FriendsService.searchUsers(searchQuery, user.id);
      if (result.success) {
        setSearchResults(result.data || []);
      } else {
        Alert.alert('Erreur', result.error || 'Erreur de recherche');
      }
    } catch (error) {
      console.error('❌ Erreur recherche:', error);
      Alert.alert('Erreur', 'Erreur lors de la recherche');
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (requestedId: string) => {
    if (!user) return;
    
    try {
      const result = await FriendsService.sendFriendRequest(user.id, requestedId);
      if (result.success) {
        Alert.alert('Succès', 'Demande d\'ami envoyée !');
        setSearchQuery('');
        setSearchResults([]);
        await loadData(); // Recharger les données
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('❌ Erreur envoi demande:', error);
      Alert.alert('Erreur', 'Erreur lors de l\'envoi');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    if (!user) return;
    
    try {
      const result = await FriendsService.acceptFriendRequest(requestId, user.id);
      if (result.success) {
        Alert.alert('Succès', 'Demande acceptée !');
        await loadData();
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors de l\'acceptation');
      }
    } catch (error) {
      console.error('❌ Erreur acceptation:', error);
      Alert.alert('Erreur', 'Erreur lors de l\'acceptation');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    if (!user) return;
    
    try {
      const result = await FriendsService.declineFriendRequest(requestId, user.id);
      if (result.success) {
        Alert.alert('Succès', 'Demande refusée');
        await loadData();
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors du refus');
      }
    } catch (error) {
      console.error('❌ Erreur refus:', error);
      Alert.alert('Erreur', 'Erreur lors du refus');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!user) return;
    
    Alert.alert(
      'Supprimer l\'ami',
      'Êtes-vous sûr de vouloir supprimer cet ami ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await FriendsService.removeFriend(user.id, friendId);
              if (result.success) {
                Alert.alert('Succès', 'Ami supprimé');
                await loadData();
              } else {
                Alert.alert('Erreur', result.error || 'Erreur lors de la suppression');
              }
            } catch (error) {
              console.error('❌ Erreur suppression:', error);
              Alert.alert('Erreur', 'Erreur lors de la suppression');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#7da06b" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header Instagramable */}
      <View style={styles.header}>
        <Text style={styles.subtitle}>Vos amis matcha</Text>
      </View>

      {/* Bouton vers profil */}
      <TouchableOpacity 
        style={styles.profileButton}
        onPress={() => navigation.navigate('Profile' as never)}
      >
        <User size={20} color="#7da06b" />
        <Text style={styles.profileButtonText}>Voir mon profil</Text>
      </TouchableOpacity>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par username..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={searching}
        >
          {searching ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Search size={16} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Résultats de recherche */}
      {searchResults.length > 0 && (
        <View style={styles.searchResultsContainer}>
          <Text style={styles.sectionTitle}>Résultats de recherche</Text>
          {searchResults.map((user) => (
            <View key={user.id} style={styles.searchResultItem}>
              <Image 
                source={{ uri: UploadService.getOptimizedImageUrl(user.avatar_url || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', 'avatar') }}
                style={styles.searchResultAvatar}
              />
              <View style={styles.searchResultInfo}>
                <Text style={styles.searchResultName}>@{user.username}</Text>
                <Text style={styles.searchResultDisplayName}>{user.display_name || 'Aucun nom'}</Text>
              </View>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => handleSendRequest(user.user_id)}
              >
                <UserPlus size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Onglets */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Users size={20} color={activeTab === 'friends' ? '#7da06b' : '#999'} />
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Amis ({friends.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Bell size={20} color={activeTab === 'requests' ? '#7da06b' : '#999'} />
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Demandes ({friendRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenu des onglets */}
      {activeTab === 'friends' ? (
        <View style={styles.friendsContainer}>
          {friends.length === 0 ? (
            <View style={styles.emptyState}>
              <Users size={48} color="#CCC" />
              <Text style={styles.emptyStateTitle}>Aucun ami</Text>
              <Text style={styles.emptyStateText}>Recherchez des utilisateurs pour commencer à construire votre Matcha Crew !</Text>
            </View>
          ) : (
            friends.map((friendship) => (
              <View key={friendship.id} style={styles.friendItem}>
                <Image 
                  source={{ uri: UploadService.getOptimizedImageUrl(friendship.friend.avatar_url || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', 'avatar') }}
                  style={styles.friendAvatar}
                />
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>{friendship.friend.username}</Text>
                  <Text style={styles.friendDisplayName}>@{friendship.friend.username}</Text>
                  <Text style={styles.friendDate}>Ami depuis {new Date(friendship.created_at).toLocaleDateString()}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => handleRemoveFriend(friendship.friend_id)}
                >
                  <X size={16} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      ) : (
        <View style={styles.requestsContainer}>
          {friendRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Bell size={48} color="#CCC" />
              <Text style={styles.emptyStateTitle}>Aucune demande</Text>
              <Text style={styles.emptyStateText}>Vous n'avez pas de demandes d'amis en attente.</Text>
            </View>
          ) : (
            friendRequests.map((request) => (
              <View key={request.id} style={styles.requestItem}>
                <Image 
                  source={{ uri: UploadService.getOptimizedImageUrl(request.requester.avatar_url || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', 'avatar') }}
                  style={styles.requestAvatar}
                />
                <View style={styles.requestInfo}>
                  <Text style={styles.requestName}>@{request.requester.username}</Text>
                  <Text style={styles.requestDate}>Demande le {new Date(request.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={styles.requestActions}>
                  <TouchableOpacity 
                    style={styles.acceptButton}
                    onPress={() => handleAcceptRequest(request.id)}
                  >
                    <Check size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.declineButton}
                    onPress={() => handleDeclineRequest(request.id)}
                  >
                    <X size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefdfb',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  profileButtonText: {
    fontSize: 16,
    color: '#7da06b',
    fontWeight: '600',
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  searchButton: {
    backgroundColor: '#7da06b',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchResultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  searchResultDisplayName: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#7da06b',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#F0F4ED',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#7da06b',
  },
  friendsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  requestsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  friendDisplayName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  friendDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  requestAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  requestDisplayName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  requestDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7da06b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FriendsScreen;
