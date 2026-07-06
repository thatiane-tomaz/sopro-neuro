import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface OnboardingResponse {
  id: string;
  user_id: string;
  weekly_cost: string | null;
  weekly_cost_value: number | null;
  cigarettes_per_day: number | null;
  vapes_per_month: number | null;
  last_cigarette_date: string | null;
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
      if (!user?.id) return null;
      
      try {
        const { data, error } = await supabase
          .from('onboarding_responses')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(1)
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
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes - onboarding data never changes
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};
