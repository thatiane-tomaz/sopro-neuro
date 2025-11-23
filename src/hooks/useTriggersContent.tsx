import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TriggerContent {
  id: string;
  title: string;
  description: string;
  file_name: string;
  duration_minutes: number | null;
  display_order: number;
  section: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useTriggersContent = () => {
  return useQuery({
    queryKey: ['triggers-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('triggers_content')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data as TriggerContent[];
    },
  });
};
