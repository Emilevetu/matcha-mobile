import { useQuery } from '@tanstack/react-query';
import { supabase, Place } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useUserSpots = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['userSpots', user?.id],
    queryFn: async (): Promise<Place[]> => {
      if (!user) {
        console.log('🔍 useUserSpots - Pas d\'utilisateur connecté');
        return [];
      }

      console.log('🔍 useUserSpots - Début de la requête Supabase...');
      
      try {
        // ÉTAPE 1: Récupérer les place_id où l'utilisateur a mis des réactions 😍
        const { data: userReactions, error: reactionsError } = await supabase
          .from('reactions')
          .select('place_id')
          .eq('user_id', user.id)
          .eq('emoji', '😍');

        if (reactionsError) {
          console.error('❌ useUserSpots - Erreur réactions:', reactionsError);
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
          console.error('❌ useUserSpots - Erreur places:', placesError);
          throw new Error(`Erreur lors du chargement des places: ${placesError.message}`);
        }

        console.log('✅ useUserSpots - Spots utilisateur:', places?.length || 0);
        return places || [];
      } catch (err) {
        console.error('💥 useUserSpots - Exception:', err);
        throw err;
      }
    },
    enabled: !!user, // Seulement si l'utilisateur est connecté
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
};
