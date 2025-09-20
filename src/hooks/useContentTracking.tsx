import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export const useContentTracking = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const trackContentView = async (contentType: 'video' | 'hypnosis', contentIdentifier: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('content_views')
        .insert({
          user_id: user.id,
          content_type: contentType,
          content_identifier: contentIdentifier
        });

      if (error) throw error;

      console.log(`Tracked ${contentType} view: ${contentIdentifier}`);
    } catch (error) {
      console.error('Error tracking content view:', error);
      toast({
        title: "Erro",
        description: "Erro ao rastrear visualização do conteúdo",
        variant: "destructive"
      });
    }
  };

  const getContentViews = async (contentType?: 'video' | 'hypnosis') => {
    if (!user) return [];

    try {
      let query = supabase
        .from('content_views')
        .select('*')
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false });

      if (contentType) {
        query = query.eq('content_type', contentType);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching content views:', error);
      return [];
    }
  };

  return {
    trackContentView,
    getContentViews
  };
};