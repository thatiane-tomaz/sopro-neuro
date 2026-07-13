import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type BrainLevel = 1 | 2 | 3 | 4 | 5;
export type BrainState = "active" | "resting";

export function computeLevel(sparks: number): BrainLevel {
  if (sparks >= 101) return 5;
  if (sparks >= 76) return 4;
  if (sparks >= 51) return 3;
  if (sparks >= 26) return 2;
  return 1;
}

export const LEVEL_RANGES: Record<BrainLevel, { min: number; max: number | null; label: string }> = {
  1: { min: 0, max: 25, label: "Despertar" },
  2: { min: 26, max: 50, label: "Conexão" },
  3: { min: 51, max: 75, label: "Fortalecimento" },
  4: { min: 76, max: 100, label: "Expansão" },
  5: { min: 101, max: null, label: "Radiância" },
};

export function useBrainSparks() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["brain-sparks", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select(
          "brain_sparks, brain_last_active_at, brain_last_login_date, brain_login_streak",
        )
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) {
        console.error("brain-sparks fetch", error);
        return null;
      }
      return data as {
        brain_sparks: number | null;
        brain_last_active_at: string | null;
        brain_last_login_date: string | null;
        brain_login_streak: number | null;
      } | null;
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const sparks = data?.brain_sparks ?? 0;
  const level = computeLevel(sparks);
  const lastActiveAt = data?.brain_last_active_at ? new Date(data.brain_last_active_at) : null;
  const isActive = lastActiveAt
    ? Date.now() - lastActiveAt.getTime() < 24 * 60 * 60 * 1000
    : false;
  const state: BrainState = isActive ? "active" : "resting";

  const nextThreshold = LEVEL_RANGES[level].max;
  const currentMin = LEVEL_RANGES[level].min;
  const progressToNext =
    nextThreshold == null
      ? 100
      : Math.min(100, Math.round(((sparks - currentMin) / (nextThreshold + 1 - currentMin)) * 100));

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

  return {
    sparks,
    level,
    state,
    streak: data?.brain_login_streak ?? 0,
    progressToNext,
    nextThreshold,
    award,
    registerLogin,
  };
}