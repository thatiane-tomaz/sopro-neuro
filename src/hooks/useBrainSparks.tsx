import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Sparks are still recorded in the database for analytics, but Neo no longer
 * has evolution levels in the UI.
 */
export function useBrainSparks() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const award = useCallback(
    async (eventKey: string, metadata?: Record<string, unknown>) => {
      if (!user) return;
      try {
        await (supabase as any).rpc("award_sparks", {
          p_event_key: eventKey,
          p_metadata: metadata ?? {},
        });
        qc.invalidateQueries({ queryKey: ["brain-sparks"] });
      } catch (e) {
        console.error("award_sparks", eventKey, e);
      }
    },
    [user, qc],
  );

  const registerLogin = useCallback(async () => {
    if (!user) return;
    try {
      await (supabase as any).rpc("register_login_and_award");
      qc.invalidateQueries({ queryKey: ["brain-sparks"] });
    } catch (e) {
      console.error("register_login_and_award", e);
    }
  }, [user, qc]);

  return { award, registerLogin };
}
