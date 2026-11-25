import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useJourneyTracking } from "@/hooks/useJourneyTracking";
import { useJourneyChoice } from "@/hooks/useJourneyChoice";
import { journeyPrefix, pickFocus, type JourneyId } from "@/lib/journeyFocus";

export interface Foco {
  id: string;
  habito_titulo: string;
  subtitulo_habito: string | null;
  imagem_nome: string | null;
  explicacao_missao: string | null;
  missao_principal: string | null;
  missao_secundaria: string | null;
  video_nome: string | null;
  hipnose_nome: string | null;
  objetivo_chat_missao: string | null;
  posicao: number | null;
  tema_fixo: boolean;
  hasVideo: boolean;
  hasHipnose: boolean;
  hasMissao: boolean;
  isSelected: boolean;
  journey: JourneyId;
}

const TIPO: Record<JourneyId, string> = { reducao: "redução", abstinencia: "abstinência" };

/** Ordem dentro de cada jornada: fixos → escolhidos no onboarding → demais. */
export function orderTemas(habitos: any[], selecionados: string[], journey: JourneyId): Foco[] {
  const byPos = (a: any, b: any) => {
    const pa = a.posicao != null ? Number(a.posicao) : Infinity;
    const pb = b.posicao != null ? Number(b.posicao) : Infinity;
    if (pa !== pb) return pa - pb;
    return String(a.habito_titulo ?? "").localeCompare(String(b.habito_titulo ?? ""), "pt-BR");
  };
  const fixos = habitos.filter((h) => h.tema_fixo === true).sort(byPos);
  const fixoIds = new Set(fixos.map((h) => h.id));
  const byTitle = new Map<string, any>();
  habitos.forEach((h) => byTitle.set(h.habito_titulo, h));
  const seen = new Set<string>();
  const escolhidos: any[] = [];
  selecionados.forEach((t) => {
    const h = byTitle.get(t);
    if (h && !seen.has(t) && !fixoIds.has(h.id)) { escolhidos.push(h); seen.add(t); }
  });
  escolhidos.sort(byPos);
  const escIds = new Set(escolhidos.map((h) => h.id));
  const restantes = habitos.filter((h) => !fixoIds.has(h.id) && !escIds.has(h.id)).sort(byPos);
  const toFoco = (h: any, isSelected: boolean): Foco => ({
    id: h.id,
    habito_titulo: h.habito_titulo,
    subtitulo_habito: h.subtitulo_habito?.trim() || null,
    imagem_nome: h.imagem_nome ?? null,
    explicacao_missao: h.explicacao_missao?.trim() || null,
    missao_principal: h.missao_principal ?? null,
    missao_secundaria: h.missao_secundaria ?? null,
    video_nome: h.video_nome ?? null,
    hipnose_nome: h.hipnose_nome ?? null,
    objetivo_chat_missao: h.objetivo_chat_missao ?? null,
    posicao: h.posicao != null ? Number(h.posicao) : null,
    tema_fixo: !!h.tema_fixo,
    hasVideo: false,
    hasHipnose: h.hipnose !== false && !!h.hipnose_nome?.trim(),
    hasMissao: h.missao !== false,
    isSelected,
    journey,
  });
  return [
    ...fixos.map((h) => toFoco(h, true)),
    ...escolhidos.map((h) => toFoco(h, true)),
    ...restantes.map((h) => toFoco(h, false)),
  ];
}

/** Chave de progresso de um tema (compartilhada entre Dash e Jornada). */
export const focoKey = (f: Foco, type: "hipnose" | "missao" | "missao_iniciada" | "video", index = 0) =>
  `${journeyPrefix(f.journey)}${type}_semana_${f.posicao ?? index + 1}`;

/** Temas das duas jornadas (com seleção do onboarding). */
export function useAllJourneyTemas() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["journey-focos-all", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [hist, onb, habitosRes] = await Promise.all([
        (supabase as any).from("historico_jornada_usuario").select("habitos_selecionados")
          .eq("user_id", user!.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        (supabase as any).from("onboarding_responses_v2").select("respostas")
          .eq("user_id", user!.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        (supabase as any).from("habitos_jornada").select("*").in("tipo_usuario", [TIPO.reducao, TIPO.abstinencia]),
      ]);
      const fromHist = Array.isArray(hist?.data?.habitos_selecionados) ? hist.data.habitos_selecionados : [];
      const fromOnb = Array.isArray(onb?.data?.respostas?.habitosSelecionados) ? onb.data.respostas.habitosSelecionados : [];
      const sel: string[] = (fromHist.length > 0 ? fromHist : fromOnb).filter((t: any) => typeof t === "string" && t.trim());
      const habitos = (habitosRes?.data as any[]) ?? [];
      return {
        reducao: orderTemas(habitos.filter((h) => h.tipo_usuario === TIPO.reducao), sel, "reducao"),
        abstinencia: orderTemas(habitos.filter((h) => h.tipo_usuario === TIPO.abstinencia), sel, "abstinencia"),
      } as Record<JourneyId, Foco[]>;
    },
  });
  return { temas: data ?? { reducao: [], abstinencia: [] }, isLoading };
}

/** Tema indicado do dia (ver regra em src/lib/journeyFocus.ts). */
export function useJourneyFocos() {
  const { trackingData } = useJourneyTracking();
  const { temas, isLoading } = useAllJourneyTemas();
  const choice = useJourneyChoice();

  return useMemo(() => {
    const isDone = (type: string) =>
      !!trackingData?.some((t) => t.interaction_type === type && t.finished_at !== null);
    const concluido = (f: Foco, i: number) => {
      const checks: boolean[] = [];
      if (f.hasHipnose) checks.push(isDone(focoKey(f, "hipnose", i)));
      if (f.hasMissao) checks.push(isDone(focoKey(f, "missao", i)));
      return checks.length > 0 && checks.every(Boolean);
    };
    const pick = pickFocus({
      temas,
      isDone: (_j, f, i) => concluido(f, i),
      onboardingJourney: choice.onboardingJourney,
      lastChosenJourney: choice.lastChosenJourney,
    });
    const journey = pick?.journey ?? choice.lastChosenJourney ?? choice.onboardingJourney;
    const list = temas[journey];
    return {
      isLoading: isLoading || choice.isLoading,
      journey,
      focoAtual: pick?.tema ?? null,
      focoAtualNumero: pick ? pick.index + 1 : 0,
      totalFocos: list.length,
      focosConcluidos: list.filter(concluido).length,
    };
  }, [temas, trackingData, isLoading, choice.onboardingJourney, choice.lastChosenJourney, choice.isLoading]);
}
