import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

interface ProfileStats {
  placesVisited: number;
  reactionsCount: number;
  photosShared: number;
  commentsCount: number;
}

export const useProfileStats = (userId: string) => {
  return useQuery<ProfileStats>({
    queryKey: ['profileStats', userId],
    queryFn: async () => {
      console.log('📊 useProfileStats - Début de la requête pour userId:', userId);

      try {
        // Requête pour les lieux visités (lieux uniques avec au moins une interaction)
        const { data: placesData, error: placesError } = await supabase
          .from('reactions')
          .select('place_id')
          .eq('user_id', userId);

        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('place_id')
          .eq('user_id', userId);

        const { data: photosData, error: photosError } = await supabase
          .from('place_photos')
          .select('place_id')
          .eq('user_id', userId);

        if (placesError) {
          console.error('❌ Erreur lieux visités:', placesError);
        }
        if (commentsError) {
          console.error('❌ Erreur commentaires:', commentsError);
        }
        if (photosError) {
          console.error('❌ Erreur photos:', photosError);
        }

        // Calculer les lieux uniques visités
        const allPlaceIds = new Set<string>();
        placesData?.forEach(item => allPlaceIds.add(item.place_id));
        commentsData?.forEach(item => allPlaceIds.add(item.place_id));
        photosData?.forEach(item => allPlaceIds.add(item.place_id));

        const placesVisited = allPlaceIds.size;

        // Requête pour le nombre de réactions
        const { count: reactionsCount, error: reactionsCountError } = await supabase
          .from('reactions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        // Requête pour le nombre de photos partagées
        const { count: photosShared, error: photosSharedError } = await supabase
          .from('place_photos')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        // Requête pour le nombre de commentaires
        const { count: commentsCount, error: commentsCountError } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (reactionsCountError) {
          console.error('❌ Erreur count réactions:', reactionsCountError);
        }
        if (photosSharedError) {
          console.error('❌ Erreur count photos:', photosSharedError);
        }
        if (commentsCountError) {
          console.error('❌ Erreur count commentaires:', commentsCountError);
        }

        const stats = {
          placesVisited,
          reactionsCount: reactionsCount || 0,
          photosShared: photosShared || 0,
          commentsCount: commentsCount || 0,
        };

        console.log('✅ useProfileStats - Statistiques récupérées:', stats);
        return stats;

      } catch (error) {
        console.error('❌ Erreur useProfileStats:', error);
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
