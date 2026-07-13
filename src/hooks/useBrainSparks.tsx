import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type BrainLevel = 1 | 2 | 3 | 4 | 5;
export type BrainState = "active" | "resting";

export type LevelRange = { min: number; max: number | null; label: string };

// Fallback used only until the DB config query resolves. The source of truth
// is `public.brain_levels_config`.
const FALLBACK_RANGES: Record<BrainLevel, LevelRange> = {
  1: { min: 0, max: 25, label: "Nível 1" },
  2: { min: 26, max: 60, label: "Nível 2" },
  3: { min: 61, max: 100, label: "Nível 3" },
  4: { min: 101, max: 150, label: "Nível 4" },
  5: { min: 151, max: null, label: "Nível 5" },
};

export function useBrainLevels(): Record<BrainLevel, LevelRange> {
  const { data } = useQuery({
    queryKey: ["brain-levels-config"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("brain_levels_config")
        .select("level, min_sparks, max_sparks, label")
        .order("level", { ascending: true });
      if (error) {
        console.error("brain_levels_config fetch", error);
        return null;
      }
      return data as Array<{
        level: number;
        min_sparks: number;
        max_sparks: number | null;
        label: string | null;
      }>;
    },
    staleTime: 5 * 60_000,
  });

  if (!data || data.length === 0) return FALLBACK_RANGES;
  const map = { ...FALLBACK_RANGES };
  for (const row of data) {
    const lv = row.level as BrainLevel;
    if (lv >= 1 && lv <= 5) {
      map[lv] = {
        min: row.min_sparks ?? 0,
        max: row.max_sparks,
        label: row.label ?? `Nível ${lv}`,
      };
    }
  }
  return map;
}

export function computeLevelFromRanges(
  sparks: number,
  ranges: Record<BrainLevel, LevelRange>,
): BrainLevel {
  for (const lv of [5, 4, 3, 2, 1] as BrainLevel[]) {
    if (sparks >= ranges[lv].min) return lv;
  }
  return 1;
}

export function useBrainSparks() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const ranges = useBrainLevels();

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
  const level = computeLevelFromRanges(sparks, ranges);
  const lastActiveAt = data?.brain_last_active_at ? new Date(data.brain_last_active_at) : null;
  const isActive = lastActiveAt
    ? Date.now() - lastActiveAt.getTime() < 48 * 60 * 60 * 1000
    : false;
  const state: BrainState = isActive ? "active" : "resting";

  const nextThreshold = ranges[level].max;
  const currentMin = ranges[level].min;
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
    ranges,
    award,
    registerLogin,
  };
}