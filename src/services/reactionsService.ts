import { supabase } from './supabase';

export interface ReactionCount {
  placeId: string;
  placeName: string;
  emoji: string;
  count: number;
}

export interface ReactionData {
  emoji?: string;
  photo?: string;
  caption?: string;
  comment?: string;
}

export interface ReactionResult {
  success: boolean;
  error?: string;
  data?: any;
}

export interface SpotReactionCount {
  placeId: string;
  placeName: string;
  heartEyesCount: number;
}

export class ReactionsService {
  static async sendReaction(userId: string, placeId: string, reactionData: ReactionData): Promise<ReactionResult> {
    try {
      console.log('💖 Envoi de réaction:', { userId, placeId, reactionData });

      // Vérifier que l'utilisateur est connecté
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ Utilisateur non connecté:', authError);
        return { success: false, error: 'Utilisateur non connecté' };
      }

      // Vérifier que l'utilisateur correspond
      if (user.id !== userId) {
        console.error('❌ ID utilisateur ne correspond pas');
        return { success: false, error: 'Erreur d\'authentification' };
      }

      // Préparer les données à insérer
      const insertData: any = {
        place_id: placeId,
        user_id: userId,
      };

      // Ajouter les données de réaction si elles existent
      if (reactionData.emoji) {
        insertData.emoji = reactionData.emoji;
      }
      if (reactionData.photo) {
        insertData.photo = reactionData.photo;
      }
      if (reactionData.caption) {
        insertData.caption = reactionData.caption;
      }
      if (reactionData.comment) {
        insertData.comment = reactionData.comment;
      }

      console.log('📝 Données à insérer:', insertData);

      // Insérer la réaction dans la base de données
      const { data, error } = await supabase
        .from('reactions')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de l\'insertion de la réaction:', error);
        return { success: false, error: `Erreur lors de l'envoi: ${error.message}` };
      }

      console.log('✅ Réaction envoyée avec succès:', data);
      return { success: true, data };

    } catch (error) {
      console.error('❌ Erreur dans sendReaction:', error);
      return { success: false, error: 'Erreur inattendue lors de l\'envoi' };
    }
  }
}

export const getTop5SpotsByHeartEyes = async (): Promise<SpotReactionCount[]> => {
  try {
    console.log('🏆 Récupération du classement des top 5 spots par réactions yeux en cœur...');
    
    // ✅ OPTIMISATION : Récupérer toutes les réactions yeux en cœur en une requête
    const { data: reactionsData, error: reactionsError } = await supabase
      .from('reactions')
      .select('place_id')
      .eq('emoji', '😍');

    if (reactionsError) {
      console.error('❌ Erreur lors de la récupération des réactions:', reactionsError);
      return [];
    }

    if (!reactionsData || reactionsData.length === 0) {
      console.log('💖 Aucune réaction yeux en cœur trouvée');
      return [];
    }

    console.log(`💖 ${reactionsData.length} réactions yeux en cœur trouvées`);

    // Compter les réactions par place_id
    const placeCounts = new Map<string, number>();
    reactionsData.forEach(reaction => {
      const placeId = reaction.place_id;
      placeCounts.set(placeId, (placeCounts.get(placeId) || 0) + 1);
    });

    // Récupérer les noms des places en une seule requête
    const placeIds = Array.from(placeCounts.keys());
    const { data: placesData, error: placesError } = await supabase
      .from('places')
      .select('id, name')
      .in('id', placeIds);

    if (placesError) {
      console.error('❌ Erreur lors de la récupération des places:', placesError);
      return [];
    }

    // Créer un map des noms de places
    const placeNames = new Map<string, string>();
    placesData?.forEach(place => {
      placeNames.set(place.id, place.name);
    });

    // Convertir en array et trier par nombre de réactions (décroissant)
    const spotCounts: SpotReactionCount[] = Array.from(placeCounts.entries())
      .map(([placeId, count]) => ({
        placeId,
        placeName: placeNames.get(placeId) || 'Place inconnue',
        heartEyesCount: count
      }))
      .sort((a, b) => b.heartEyesCount - a.heartEyesCount);

    // Prendre les top 5
    const top5 = spotCounts.slice(0, 5);

    console.log('🏆 Top 5 des spots:', top5);
    console.log(`⚡ Optimisation: 2 requêtes au lieu de ${placeCounts.size + 1} requêtes`);
    
    return top5;
  } catch (error) {
    console.error('❌ Erreur dans getTop5SpotsByHeartEyes:', error);
    return [];
  }
};

export const getReactionCountForPlace = async (placeName: string, emoji: string): Promise<number> => {
  try {
    console.log(`🔍 Recherche des réactions pour "${placeName}" avec l'émoji "${emoji}"`);
    
    // 1. Trouver la place par nom
    const { data: places, error: placesError } = await supabase
      .from('places')
      .select('id, name')
      .ilike('name', `%${placeName}%`);

    if (placesError) {
      console.error('❌ Erreur lors de la recherche de places:', placesError);
      return 0;
    }

    if (!places || places.length === 0) {
      console.log(`📍 Aucune place trouvée avec le nom "${placeName}"`);
      return 0;
    }

    const place = places[0];
    console.log(`📍 Place trouvée: "${place.name}" (ID: ${place.id})`);

    // 2. Récupérer les réactions pour cette place avec l'émoji spécifique
    const { data: reactions, error: reactionsError } = await supabase
      .from('reactions')
      .select('emoji')
      .eq('place_id', place.id)
      .eq('emoji', emoji);

    if (reactionsError) {
      console.error('❌ Erreur lors de la récupération des réactions:', reactionsError);
      return 0;
    }

    const count = reactions?.length || 0;
    console.log(`💖 Nombre de réactions "${emoji}" pour "${place.name}": ${count}`);
    
    return count;
  } catch (error) {
    console.error('❌ Erreur dans getReactionCountForPlace:', error);
    return 0;
  }
};