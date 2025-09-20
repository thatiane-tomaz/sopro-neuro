import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  subscription_status: 'free' | 'premium';
}

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setProfile(data as UserProfile);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar perfil do usuário",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, toast]);

  const hasAccessToDay = (day: number): boolean => {
    if (!profile) return false;
    
    // Usuários free têm acesso aos dias 1 e 2
    if (profile.subscription_status === 'free') {
      return day <= 2;
    }
    
    // Usuários premium têm acesso total
    if (profile.subscription_status === 'premium') {
      return true;
    }
    
    return false;
  };

  const upgradeRequired = (day: number): boolean => {
    return !hasAccessToDay(day) && profile?.subscription_status === 'free';
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