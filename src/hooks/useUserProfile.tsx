import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  subscription_status: 'free' | 'premium';
  email?: string;
  onesignal_player_id?: string;
}

export const useUserProfile = () => {
  const { user } = useAuth();

  const { data: profile, isLoading: loading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      return data as UserProfile | null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const hasAccessToDay = (day: number): boolean => {
    // Todos os usuários cadastrados têm acesso a todos os dias
    // (só consegue cadastrar quem pagou ou está na freelist)
    return !!profile;
  };

  const upgradeRequired = (_day: number): boolean => {
    // Não há mais limitação por plano - todos têm acesso completo
    return false;
  };

  return {
    profile,
    loading,
    hasAccessToDay,
    upgradeRequired,
    isPremium: profile?.subscription_status === 'premium',
    isFree: profile?.subscription_status === 'free'
  };
};