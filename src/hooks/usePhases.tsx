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
      const { data, error } = await (supabase as any)
        .from('phases')
        .select('*')
        .order('phase_number', { ascending: true });

      if (error) throw error;
      return (data || []) as Phase[];
    },
  });
};
