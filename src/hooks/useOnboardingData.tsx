import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface OnboardingResponse {
  id: string;
  user_id: string;
  weekly_cost: string | null;
  age: string | null;
  gender: string | null;
  smoking_frequency: string | null;
  smoking_types: string[] | null;
  smoking_reasons: string[] | null;
  completed_at: string;
}

export const useOnboardingData = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['onboarding_response', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      try {
        const { data, error } = await supabase
          .from('onboarding_responses')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching onboarding data:', error);
          return null;
        }
        return data as OnboardingResponse | null;
      } catch (error) {
        console.error('Error in onboarding data query:', error);
        return null;
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes - onboarding data rarely changes
    refetchOnWindowFocus: false,
  });
};
