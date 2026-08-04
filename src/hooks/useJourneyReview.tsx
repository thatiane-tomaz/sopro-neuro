import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useJourneyTracking } from "@/hooks/useJourneyTracking";

export interface RevisaoContext {
  habitos: Array<{ titulo: string; tema_fixo: boolean }>;
  habitosConcluidos: string[];
  gatilhosAnteriores: string[];
}

/**
 * Detecta quando o usuário concluiu TODOS os focos da jornada de redução
 * (vídeo, hipnose e missão de cada foco selecionado) para propor uma revisão
 * de gatilhos e montar uma nova jornada.
 */
export function useJourneyReview(jornadaType?: string) {
  const { user } = useAuth();
  const { trackingData } = useJourneyTracking();
  const enabled = !!user?.id && jornadaType === "redução";

  const { data } = useQuery({
    queryKey: ["journey-review", user?.id],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [hist, onb, habitosRes] = await Promise.all([
        (supabase as any)
          .from("historico_jornada_usuario")
          .select("habitos_selecionados")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        (supabase as any)
          .from("onboarding_responses_v2")
          .select("respostas")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        (supabase as any)
          .from("habitos_jornada")
          .select("id,habito_titulo,tema_fixo,posicao,video,hipnose,missao")
          .eq("tipo_usuario", "redução"),
      ]);

      const fromHist = Array.isArray(hist?.data?.habitos_selecionados)
        ? (hist.data.habitos_selecionados as string[])
        : [];
      const fromOnb = Array.isArray(onb?.data?.respostas?.habitosSelecionados)
        ? (onb.data.respostas.habitosSelecionados as string[])
        : [];
      const selecionados = fromHist.length > 0 ? fromHist : fromOnb;

      return {
        habitos: ((habitosRes?.data as any[]) ?? []),
        selecionados: selecionados.filter((t) => typeof t === "string" && t.trim()),
        gatilhosAnteriores: Array.from(
          new Set([...fromHist, ...fromOnb].filter((t) => typeof t === "string" && t.trim())),
        ),
      };
    },
  });

  return useMemo(() => {
    if (!enabled || !data || !trackingData) {
      return { needsReview: false, revisao: null as RevisaoContext | null };
    }

    const habitos = data.habitos ?? [];
    if (habitos.length === 0) return { needsReview: false, revisao: null };

    const byTitle = new Map<string, any>();
    habitos.forEach((h) => byTitle.set(h.habito_titulo, h));

    const fixos = habitos.filter((h) => h.tema_fixo === true);
    const fixoIds = new Set(fixos.map((h) => h.id));
    const escolhidos = data.selecionados
      .map((t) => byTitle.get(t))
      .filter((h) => h && !fixoIds.has(h.id));

    const focos = [...fixos, ...escolhidos];
    if (focos.length === 0) return { needsReview: false, revisao: null };

    const isDone = (type: string) =>
      trackingData.some((t) => t.interaction_type === type && t.finished_at !== null);

    const focoConcluido = (h: any) => {
      const pos = h.posicao != null ? Number(h.posicao) : null;
      if (pos == null) return false;
      const checks: boolean[] = [];
      if (h.video !== false) checks.push(isDone(`video_semana_${pos}`));
      if (h.hipnose !== false) checks.push(isDone(`hipnose_semana_${pos}`));
      if (h.missao !== false) checks.push(isDone(`missao_semana_${pos}`));
      return checks.length > 0 && checks.every(Boolean);
    };

    const concluidos = focos.filter(focoConcluido);
    const needsReview = concluidos.length === focos.length;

    const revisao: RevisaoContext = {
      habitos: [...habitos]
        .sort((a, b) => Number(a.posicao ?? 999) - Number(b.posicao ?? 999))
        .map((h) => ({ titulo: h.habito_titulo as string, tema_fixo: !!h.tema_fixo })),
      habitosConcluidos: concluidos.map((h) => h.habito_titulo as string),
      gatilhosAnteriores: data.gatilhosAnteriores,
    };

    return { needsReview, revisao };
  }, [enabled, data, trackingData]);
}
