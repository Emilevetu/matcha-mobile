import { supabase, Reaction, PlacePhoto } from './supabase';

export interface ReactionData {
  emoji?: string;
  photo?: string;
  caption?: string;
  comment?: string;
}

export interface ReactionWithUser extends Reaction {
  user: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export interface PlacePhotoWithUser extends PlacePhoto {
  user: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export const ReactionsService = {
  // 1. Envoyer une réaction complète (emoji + photo + commentaire)
  async sendReaction(
    userId: string, 
    placeId: string, 
    data: ReactionData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🎯 Envoi réaction:', { userId, placeId, data });
      
      const results = [];
      
      // 1. Envoyer l'emoji si présent
      if (data.emoji) {
        const { error: emojiError } = await supabase
          .from('reactions')
          .insert({
            user_id: userId,
            place_id: placeId,
            emoji: data.emoji
          });
        
        if (emojiError) {
          console.error('❌ Erreur emoji:', emojiError);
          return { success: false, error: emojiError.message };
        }
        results.push('emoji');
      }
      
      // 2. Envoyer la photo si présente
      if (data.photo) {
        const { error: photoError } = await supabase
          .from('place_photos')
          .insert({
            user_id: userId,
            place_id: placeId,
            photo_url: data.photo,
            caption: data.caption || null
          });
        
        if (photoError) {
          console.error('❌ Erreur photo:', photoError);
          return { success: false, error: photoError.message };
        }
        results.push('photo');
      }
      
      // 3. Envoyer le commentaire si présent
      if (data.comment) {
        const { error: commentError } = await supabase
          .from('comments')
          .insert({
            user_id: userId,
            place_id: placeId,
            content: data.comment
          });
        
        if (commentError) {
          console.error('❌ Erreur commentaire:', commentError);
          return { success: false, error: commentError.message };
        }
        results.push('comment');
      }
      
      console.log('✅ Réaction envoyée:', results);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Erreur envoi réaction:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  // 2. Récupérer les réactions d'un lieu
  async getPlaceReactions(placeId: string): Promise<{ 
    success: boolean; 
    data?: { reactions: ReactionWithUser[]; photos: PlacePhotoWithUser[] }; 
    error?: string 
  }> {
    try {
      console.log('📊 Récupération réactions lieu:', placeId);
      
      // Récupérer les réactions emoji
      const { data: reactions, error: reactionsError } = await supabase
        .from('reactions')
        .select(`
          *,
          user:profiles!reactions_user_id_fkey(username, avatar_url)
        `)
        .eq('place_id', placeId)
        .order('created_at', { ascending: false });
      
      if (reactionsError) {
        console.error('❌ Erreur réactions:', reactionsError);
        return { success: false, error: reactionsError.message };
      }
      
      // Récupérer les photos
      const { data: photos, error: photosError } = await supabase
        .from('place_photos')
        .select(`
          *,
          user:profiles!place_photos_user_id_fkey(username, avatar_url)
        `)
        .eq('place_id', placeId)
        .order('created_at', { ascending: false });
      
      if (photosError) {
        console.error('❌ Erreur photos:', photosError);
        return { success: false, error: photosError.message };
      }
      
      console.log('✅ Réactions récupérées:', { 
        reactions: reactions?.length || 0, 
        photos: photos?.length || 0 
      });
      
      return { 
        success: true, 
        data: { 
          reactions: reactions || [], 
          photos: photos || [] 
        } 
      };
      
    } catch (error) {
      console.error('❌ Erreur récupération réactions:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  // 3. Supprimer une réaction
  async deleteReaction(reactionId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('id', reactionId)
        .eq('user_id', userId);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  // 4. Supprimer une photo
  async deletePhoto(photoId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('place_photos')
        .delete()
        .eq('id', photoId)
        .eq('user_id', userId);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
};
