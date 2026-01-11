import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Phase {
  id: string;
  phase_number: number;
  title: string;
  subtitle: string;
  created_at: string;
  updated_at: string;
}

export const usePhases = () => {
  return useQuery({
    queryKey: ['phases'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('phases')
          .select('*')
          .order('phase_number', { ascending: true });

        if (error) {
          console.error('Error fetching phases:', error);
          return [];
        }
        return (data || []) as Phase[];
      } catch (error) {
        console.error('Error in phases query:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - phases rarely change
    refetchOnWindowFocus: false,
  });
};
