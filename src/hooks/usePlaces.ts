import { useQuery } from '@tanstack/react-query';
import { supabase, Place } from '../services/supabase';

export const usePlaces = () => {
  return useQuery({
    queryKey: ['places'],
    queryFn: async (): Promise<Place[]> => {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erreur lors du chargement des lieux: ${error.message}`);
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};