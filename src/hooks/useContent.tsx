import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Content {
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
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export const useContent = (weekNumber: number, dayNumber: number) => {
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data, error } = await supabase
          .from('content')
          .select('*')
          .eq('week_number', weekNumber)
          .eq('day_number', dayNumber)
          .order('sort_order', { ascending: true });

        if (error) throw error;
        setContent(data as Content[] || []);
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

  const getVideoContent = () => content.find(c => c.content_type === 'video');
  const getHypnosisContent = () => content.find(c => c.content_type === 'hypnosis');

  return {
    content,
    loading,
    getVideoContent,
    getHypnosisContent
  };
};