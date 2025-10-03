import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

interface Badge {
  id: number;
  name: string;
  color: string;
}

interface PlaceBadge {
  id: number;
  badge_id: number;
  badge: Badge;
  user_id: string;
  created_at: string;
}

interface TopBadge {
  badge_id: number;
  badge_name: string;
  badge_color: string;
  count: number;
}

export const usePlaceBadges = (placeId: string) => {
  return useQuery<{
    topBadges: TopBadge[];
    userBadges: PlaceBadge[];
    allBadges: Badge[];
  }, Error>({
    queryKey: ['placeBadges', placeId],
    queryFn: async () => {
      if (!placeId) {
        return { topBadges: [], userBadges: [], allBadges: [] };
      }

      console.log('🏷️ usePlaceBadges - Début de la requête pour placeId:', placeId);

      // Récupérer les top 5 badges les plus utilisés
      const { data: topBadgesData, error: topBadgesError } = await supabase
        .from('place_badges')
        .select(`
          badge_id,
          badges!inner(name, color)
        `)
        .eq('place_id', placeId);

      if (topBadgesError) throw topBadgesError;

      // Compter les occurrences et trier
      const badgeCounts = new Map<number, { name: string; color: string; count: number }>();
      
      topBadgesData?.forEach((item: any) => {
        const badgeId = item.badge_id;
        const badge = item.badges;
        
        if (badgeCounts.has(badgeId)) {
          badgeCounts.get(badgeId)!.count++;
        } else {
          badgeCounts.set(badgeId, {
            name: badge.name,
            color: badge.color,
            count: 1
          });
        }
      });

      const topBadges = Array.from(badgeCounts.entries())
        .map(([badge_id, data]) => ({
          badge_id,
          badge_name: data.name,
          badge_color: data.color,
          count: data.count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Récupérer tous les badges disponibles
      const { data: allBadges, error: allBadgesError } = await supabase
        .from('badges')
        .select('*')
        .order('name');

      if (allBadgesError) throw allBadgesError;

      console.log('✅ usePlaceBadges - Badges récupérés:', {
        topBadges: topBadges.length,
        allBadges: allBadges?.length || 0
      });

      // Récupérer les badges de l'utilisateur connecté
      const { data: userBadgesData, error: userBadgesError } = await supabase
        .from('place_badges')
        .select(`
          id,
          badge_id,
          badges!inner(name, color),
          user_id,
          created_at
        `)
        .eq('place_id', placeId);

      if (userBadgesError) throw userBadgesError;

      const userBadges = userBadgesData?.map((item: any) => ({
        id: item.id,
        badge_id: item.badge_id,
        badge: item.badges,
        user_id: item.user_id,
        created_at: item.created_at
      })) || [];

      return {
        topBadges,
        userBadges,
        allBadges: allBadges || []
      };
    },
    enabled: !!placeId,
    staleTime: 1000 * 30, // 30 secondes
  });
};
