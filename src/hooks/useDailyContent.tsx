import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DailyContent {
  id: string;
  day_number: number;
  title: string;
  video_minutes: number | null;
  hypnosis_minutes: number | null;
  welcome_title: string | null;
  welcome_subtitle: string | null;
  created_at: string;
  updated_at: string;
}

export const useDailyContent = () => {
  return useQuery({
    queryKey: ['daily_content'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('daily_content')
        .select('*')
        .order('day_number', { ascending: true });

      if (error) throw error;
      return (data || []) as DailyContent[];
    },
  });
};
