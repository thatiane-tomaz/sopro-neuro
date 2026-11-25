import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toJourneyId, type JourneyId } from "@/lib/journeyFocus";

/**
 * Jornada do onboarding + última jornada em que a pessoa abriu um tema.
 * As duas jornadas ficam sempre disponíveis; isso só decide o tema indicado.
 */
export function useJourneyChoice() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["journey-choice", user?.id],
    enabled: !!user?.id,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const [onb, hist, last] = await Promise.all([
        (supabase as any).from("onboarding_responses_v2").select("jornada_inicial")
          .eq("user_id", user!.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        (supabase as any).from("historico_jornada_usuario").select("jornada")
          .eq("user_id", user!.id).order("created_at", { ascending: true }).limit(1).maybeSingle(),
        (supabase as any).from("ultima_jornada_usuario").select("jornada")
          .eq("user_id", user!.id).maybeSingle(),
      ]);
      return {
        onboardingJourney: toJourneyId(onb?.data?.jornada_inicial ?? hist?.data?.jornada),
        lastChosenJourney: last?.data?.jornada ? toJourneyId(last.data.jornada) : null,
      } as { onboardingJourney: JourneyId; lastChosenJourney: JourneyId | null };
    },
  });

  const chooseJourney = useCallback(
    async (j: JourneyId) => {
      if (!user?.id || data?.lastChosenJourney === j) return;
      if (!data?.lastChosenJourney && data?.onboardingJourney === j) return;
      const { error } = await (supabase as any)
        .from("ultima_jornada_usuario")
        .upsert({ user_id: user.id, jornada: j }, { onConflict: "user_id" });
      if (error) console.error("ultima jornada error", error);
      qc.invalidateQueries({ queryKey: ["journey-choice"] });
    },
    [user?.id, data, qc],
  );

  return {
    isLoading,
    onboardingJourney: data?.onboardingJourney ?? "reducao",
    lastChosenJourney: data?.lastChosenJourney ?? null,
    chooseJourney,
  };
}
