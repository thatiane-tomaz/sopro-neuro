import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Capacitor } from '@capacitor/core';

export const useErrorLogging = () => {
  const { user } = useAuth();
  const platform = Capacitor.getPlatform();

  const logError = useCallback(async (
    errorMessage: string,
    errorStack?: string,
    errorContext?: string
  ) => {
    try {
      await supabase.from('app_error_logs').insert({
        user_id: user?.id || null,
        error_message: errorMessage.substring(0, 2000),
        error_stack: errorStack?.substring(0, 5000) || null,
        error_context: errorContext || null,
        page_url: window.location.pathname,
        platform,
      });
    } catch (e) {
      // Silently fail - don't cause more errors trying to log errors
      console.warn('[ErrorLogging] Failed to log error:', e);
    }
  }, [user?.id, platform]);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      logError(
        event.message,
        event.error?.stack,
        'window.onerror'
      );
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message || String(event.reason);
      logError(
        message,
        event.reason?.stack,
        'unhandledrejection'
      );
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [logError]);

  return { logError };
};
