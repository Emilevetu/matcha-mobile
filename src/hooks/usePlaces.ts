import { useQuery } from '@tanstack/react-query';
import { supabase, Place } from '../services/supabase';

export const usePlaces = () => {
  return useQuery({
    queryKey: ['places'],
    queryFn: async (): Promise<Place[]> => {
      console.log('🔍 usePlaces - Début de la requête Supabase...');
      
      try {
        const { data, error } = await supabase
          .from('places')
          .select('id, name, address, lat, lng, photos, hours');

        console.log('📊 usePlaces - Réponse Supabase:', { 
          dataLength: data?.length, 
          error: error?.message,
          hasData: !!data 
        });

        if (error) {
          console.error('❌ usePlaces - Erreur Supabase:', error);
          throw new Error(`Erreur lors du chargement des lieux: ${error.message}`);
        }

        console.log('✅ usePlaces - Données récupérées:', data?.length || 0, 'lieux');
        return data || [];
      } catch (err) {
        console.error('💥 usePlaces - Exception:', err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};