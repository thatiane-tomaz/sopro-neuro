import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DailyContent {
  id: string;
  day_number: number;
  title: string;
  video_minutes: number | null;
  hypnosis_minutes: number | null;
  welcome_title: string | null;
  created_at: string;
  updated_at: string;
}

export const useDailyContent = () => {
  return useQuery({
    queryKey: ['daily_content'],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('daily_content')
          .select('*')
          .order('day_number', { ascending: true });

        if (error) {
          console.error('Error fetching daily content:', error);
          return [];
        }
        return (data || []) as DailyContent[];
      } catch (error) {
        console.error('Error in daily content query:', error);
        return [];
      }
    },
  });
};
