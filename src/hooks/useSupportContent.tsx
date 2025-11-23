import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SupportContent {
  id: string;
  title: string;
  description: string | null;
  file_name: string;
  duration_minutes: number | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useSupportContent = () => {
  return useQuery({
    queryKey: ['support-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_content')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data as SupportContent[];
    },
  });
};
