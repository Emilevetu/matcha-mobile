import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

interface PlaceStats {
  totalInteractions: number;
  photosCount: number;
  reactionsCount: number;
  commentsCount: number;
}

export const usePlaceStats = (placeId: string) => {
  return useQuery<PlaceStats, Error>({
    queryKey: ['placeStats', placeId],
    queryFn: async () => {
      if (!placeId) {
        return { totalInteractions: 0, photosCount: 0, reactionsCount: 0, commentsCount: 0 };
      }

      console.log('📊 usePlaceStats - Début de la requête pour placeId:', placeId);

      // Compter les photos
      const { count: photosCount, error: photosError } = await supabase
        .from('place_photos')
        .select('*', { count: 'exact', head: true })
        .eq('place_id', placeId);

      if (photosError) throw photosError;

      // Compter les réactions
      const { count: reactionsCount, error: reactionsError } = await supabase
        .from('reactions')
        .select('*', { count: 'exact', head: true })
        .eq('place_id', placeId);

      if (reactionsError) throw reactionsError;

      // Compter les commentaires
      const { count: commentsCount, error: commentsError } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('place_id', placeId);

      if (commentsError) throw commentsError;

      const totalInteractions = (photosCount || 0) + (reactionsCount || 0) + (commentsCount || 0);

      console.log('✅ usePlaceStats - Statistiques récupérées:', {
        photosCount: photosCount || 0,
        reactionsCount: reactionsCount || 0,
        commentsCount: commentsCount || 0,
        totalInteractions,
      });

      return {
        totalInteractions,
        photosCount: photosCount || 0,
        reactionsCount: reactionsCount || 0,
        commentsCount: commentsCount || 0,
      };
    },
    enabled: !!placeId,
    staleTime: 1000 * 30, // 30 secondes pour refresh plus fréquent
  });
};
