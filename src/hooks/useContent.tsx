import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  content_type: 'video' | 'hypnosis';
  week_number: number;
  day_number: number;
  duration_minutes: number | null;
  file_url: string | null;
  thumbnail_url: string | null;
  is_premium: boolean;
  sort_order: number;
}

export const useContent = (weekNumber: number, dayNumber: number) => {
  const [content, setContent] = useState<{
    video: ContentItem | null;
    hypnosis: ContentItem | null;
  }>({
    video: null,
    hypnosis: null
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('content')
          .select('*')
          .eq('week_number', weekNumber)
          .eq('day_number', dayNumber)
          .order('content_type');

        if (error) throw error;

        const video = data?.find(item => item.content_type === 'video') as ContentItem | undefined || null;
        const hypnosis = data?.find(item => item.content_type === 'hypnosis') as ContentItem | undefined || null;

        setContent({ video, hypnosis });
      } catch (error) {
        console.error('Error fetching content:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar conteúdo",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [weekNumber, dayNumber, toast]);

  return { content, loading };
};