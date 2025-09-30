import { supabase, Friendship, FriendRequest, Profile } from './supabase';

export interface FriendWithProfile extends Friendship {
  friend_profile: Profile;
}

export interface FriendRequestWithProfile extends FriendRequest {
  requester_profile: Profile;
  requested_profile: Profile;
}

export const FriendsService = {
  // 1. Rechercher des utilisateurs par username ou email
  async searchUsers(query: string, currentUserId: string): Promise<{ success: boolean; data?: Profile[]; error?: string }> {
    try {
      console.log('🔍 Recherche d\'utilisateurs:', { query, currentUserId });
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .neq('user_id', currentUserId); // Exclure l'utilisateur actuel
      
      if (error) {
        console.error('❌ Erreur recherche utilisateurs:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ Utilisateurs trouvés:', data?.length || 0);
      return { success: true, data: data || [] };
      
    } catch (error) {
      console.error('❌ Erreur recherche utilisateurs:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  // 2. Envoyer une demande d'ami
  async sendFriendRequest(requesterId: string, requestedId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📤 Envoi demande d\'ami:', { requesterId, requestedId });
      
      // Vérifier qu'on ne s'ajoute pas soi-même
      if (requesterId === requestedId) {
        return { success: false, error: 'Vous ne pouvez pas vous ajouter en ami' };
      }
      
      // Vérifier qu'il n'y a pas déjà une demande
      const { data: existingRequest } = await supabase
        .from('friend_requests')
        .select('id')
        .or(`and(requester_id.eq.${requesterId},requested_id.eq.${requestedId}),and(requester_id.eq.${requestedId},requested_id.eq.${requesterId})`)
        .single();
      
      if (existingRequest) {
        return { success: false, error: 'Une demande existe déjà entre ces utilisateurs' };
      }
      
      // Vérifier qu'ils ne sont pas déjà amis
      const { data: existingFriendship } = await supabase
        .from('friendships')
        .select('id')
        .or(`and(user_id.eq.${requesterId},friend_id.eq.${requestedId}),and(user_id.eq.${requestedId},friend_id.eq.${requesterId})`)
        .single();
      
      if (existingFriendship) {
        return { success: false, error: 'Ces utilisateurs sont déjà amis' };
      }
      
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          requester_id: requesterId,
          requested_id: requestedId,
          status: 'pending'
        });
      
      if (error) {
        console.error('❌ Erreur envoi demande:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ Demande d\'ami envoyée');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Erreur envoi demande d\'ami:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  // 3. Accepter une demande d'ami
  async acceptFriendRequest(requestId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('✅ Acceptation demande d\'ami:', { requestId, userId });
      
      // Récupérer la demande
      const { data: request, error: fetchError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('id', requestId)
        .eq('requested_id', userId)
        .eq('status', 'pending')
        .single();
      
      if (fetchError || !request) {
        console.error('❌ Demande non trouvée:', { fetchError, request });
        return { success: false, error: 'Demande non trouvée' };
      }
      
      console.log('📋 Demande trouvée:', { 
        requester_id: request.requester_id, 
        requested_id: request.requested_id 
      });
      
      // Mettre à jour le statut de la demande
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);
      
      if (updateError) {
        return { success: false, error: updateError.message };
      }
      
      // Créer l'amitié bidirectionnelle
      console.log('👥 Création amitié bidirectionnelle:', {
        ligne1: { user_id: request.requester_id, friend_id: request.requested_id },
        ligne2: { user_id: request.requested_id, friend_id: request.requester_id }
      });
      
      const { error: friendshipError } = await supabase
        .from('friendships')
        .insert([
          { user_id: request.requester_id, friend_id: request.requested_id },
          { user_id: request.requested_id, friend_id: request.requester_id }
        ]);
      
      if (friendshipError) {
        console.error('❌ Erreur création amitié:', friendshipError);
        return { success: false, error: friendshipError.message };
      }
      
      console.log('✅ Demande d\'ami acceptée et amitié créée');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Erreur acceptation demande:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  // 4. Refuser une demande d'ami
  async declineFriendRequest(requestId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('❌ Refus demande d\'ami:', { requestId, userId });
      
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'declined' })
        .eq('id', requestId)
        .eq('requested_id', userId);
      
      if (error) {
        console.error('❌ Erreur refus demande:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ Demande d\'ami refusée');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Erreur refus demande:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  // 5. Récupérer les amis avec leurs profils
  async getFriends(userId: string): Promise<{ success: boolean; data?: FriendWithProfile[]; error?: string }> {
    try {
      console.log('👥 Récupération des amis:', userId);
      
      // 1. Récupérer les friendships
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select('*')
        .eq('user_id', userId);
      
      if (friendshipsError) {
        console.error('❌ Erreur récupération friendships:', friendshipsError);
        return { success: false, error: friendshipsError.message };
      }

      if (!friendships || friendships.length === 0) {
        return { success: true, data: [] };
      }

      // 2. Récupérer les profils des amis
      const friendIds = friendships.map(f => f.friend_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, username, display_name, avatar_url')
        .in('user_id', friendIds);

      if (profilesError) {
        console.error('❌ Erreur récupération profils amis:', profilesError);
        return { success: false, error: profilesError.message };
      }

      // 3. Combiner les données
      const friendsWithProfiles = friendships.map(friendship => {
        const profile = profiles?.find(p => p.user_id === friendship.friend_id);
        return {
          ...friendship,
          friend: profile ? {
            id: profile.id,
            user_id: profile.user_id,
            username: profile.username,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            created_at: profile.created_at || '',
            updated_at: profile.updated_at || ''
          } : { 
            id: friendship.friend_id, 
            user_id: friendship.friend_id, 
            username: 'Utilisateur inconnu', 
            display_name: 'Utilisateur inconnu', 
            avatar_url: null,
            created_at: '',
            updated_at: ''
          }
        };
      });
      
      console.log('✅ Amis récupérés:', friendsWithProfiles.length);
      return { success: true, data: friendsWithProfiles };
      
    } catch (error) {
      console.error('❌ Erreur récupération amis:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  // 6. Récupérer les demandes d'amis (méthode robuste)
  async getFriendRequests(userId: string): Promise<{ success: boolean; data?: FriendRequestWithProfile[]; error?: string }> {
    try {
      console.log('📨 Récupération demandes d\'amis:', userId);
      
      // 1. Récupérer les demandes reçues
      const { data: requests, error: requestsError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('requested_id', userId)
        .eq('status', 'pending');
      
      if (requestsError) {
        console.error('❌ Erreur récupération demandes:', requestsError);
        return { success: false, error: requestsError.message };
      }

      if (!requests || requests.length === 0) {
        console.log('✅ Aucune demande d\'ami en attente');
        return { success: true, data: [] };
      }

      // 2. Récupérer les profils des utilisateurs
      const requesterIds = requests.map(r => r.requester_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, username, display_name, avatar_url')
        .in('user_id', requesterIds);

      if (profilesError) {
        console.error('❌ Erreur récupération profils:', profilesError);
        return { success: false, error: profilesError.message };
      }

      // 3. Combiner les données
      const requestsWithProfiles = requests.map(request => {
        const requesterProfile = profiles?.find(p => p.user_id === request.requester_id);
        return {
          ...request,
          requester: requesterProfile ? {
            id: requesterProfile.id,
            user_id: requesterProfile.user_id,
            username: requesterProfile.username,
            display_name: requesterProfile.display_name,
            avatar_url: requesterProfile.avatar_url
          } : { 
            id: request.requester_id, 
            user_id: request.requester_id, 
            username: 'Utilisateur inconnu', 
            display_name: 'Utilisateur inconnu', 
            avatar_url: null 
          },
          requested: {
            id: request.requested_id,
            user_id: request.requested_id,
            username: 'Vous',
            display_name: 'Vous',
            avatar_url: null
          }
        };
      });
      
      console.log('✅ Demandes récupérées:', requestsWithProfiles.length);
      console.log('📊 Première demande:', {
        requester: requestsWithProfiles[0]?.requester?.username,
        avatar: requestsWithProfiles[0]?.requester?.avatar_url ? 'présent' : 'absent'
      });
      
      return { success: true, data: requestsWithProfiles };
      
    } catch (error) {
      console.error('❌ Erreur récupération demandes:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  // 7. Supprimer un ami
  async removeFriend(userId: string, friendId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🗑️ Suppression ami:', { userId, friendId });
      
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);
      
      if (error) {
        console.error('❌ Erreur suppression ami:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ Ami supprimé');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Erreur suppression ami:', error);
      return { success: false, error: (error as Error).message };
    }
  }
};
