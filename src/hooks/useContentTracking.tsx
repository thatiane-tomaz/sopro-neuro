import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useContentTracking = () => {
  const { user } = useAuth();

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

      if (error) {
        console.error('Error tracking content view:', error);
        return; // Silently fail - não crashar o app por erro de tracking
      }

      console.log(`Tracked ${contentType} view: ${contentIdentifier}`);
    } catch (error) {
      console.error('Error tracking content view:', error);
      // Silently fail - tracking não deve crashar o app
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