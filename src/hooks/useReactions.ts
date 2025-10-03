import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, Reaction } from '../services/supabase';

export const useReactions = (placeId: string) => {
  return useQuery({
    queryKey: ['reactions', placeId],
    queryFn: async (): Promise<Reaction[]> => {
      const { data, error } = await supabase
        .from('reactions')
        .select('id, emoji, photo, comment, created_at, user_id')
        .eq('place_id', placeId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erreur lors du chargement des réactions: ${error.message}`);
      }

      return data || [];
    },
    enabled: !!placeId,
    // ✅ OPTIMISATION : Cache pour 2 minutes (réactions changent plus souvent)
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAddReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ placeId, emoji }: { placeId: string; emoji: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      const { data, error } = await supabase
        .from('reactions')
        .insert({
          place_id: placeId,
          user_id: user.id,
          emoji,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Erreur lors de l'ajout de la réaction: ${error.message}`);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      // Invalider et refetch les réactions pour ce lieu
      queryClient.invalidateQueries({ queryKey: ['reactions', variables.placeId] });
    },
  });
};