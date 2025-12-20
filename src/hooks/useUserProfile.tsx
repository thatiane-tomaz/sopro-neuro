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
    let isMounted = true;

    const fetchProfile = async () => {
      if (!user) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!isMounted) return;

        if (error) {
          console.error('Error fetching profile:', error);
        } else {
          setProfile(data as UserProfile | null);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const hasAccessToDay = (day: number): boolean => {
    if (!profile) return false;
    if (profile.subscription_status === 'premium') return true;
    return day <= 2;
  };

  const upgradeRequired = (day: number): boolean => {
    if (!profile) return false;
    if (profile.subscription_status === 'premium') return false;
    return day > 2;
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