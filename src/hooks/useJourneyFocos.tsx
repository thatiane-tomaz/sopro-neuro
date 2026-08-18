import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useJourneyTracking } from "@/hooks/useJourneyTracking";

export interface Foco {
  id: string;
  habito_titulo: string;
  explicacao_missao: string | null;
  video_nome: string | null;
  hipnose_nome: string | null;
  objetivo_chat_missao: string | null;
  posicao: number | null;
  tema_fixo: boolean;
  hasVideo: boolean;
  hasHipnose: boolean;
  hasMissao: boolean;
  isSelected: boolean;
}

/**
 * Carrega dinamicamente os temas (focos) de `habitos_jornada` para a jornada do
 * usuário. Qualquer tema novo inserido na tabela passa a aparecer no app sem
 * precisar de nova versão: a ordem, a quantidade total e o foco atual são
 * calculados a partir dos dados.
 *
 * Ordem: temas fixos (por posicao) → temas escolhidos pelo usuário → restantes.
 * Foco atual = primeiro tema (entre fixos + escolhidos) ainda não concluído.
 */
export function useJourneyFocos(jornadaType?: string) {
  const { user } = useAuth();
  const { trackingData } = useJourneyTracking();
  const enabled = !!user?.id && !!jornadaType;

  const { data, isLoading } = useQuery({
    queryKey: ["journey-focos", user?.id, jornadaType],
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
          .select("*")
          .eq("tipo_usuario", jornadaType),
      ]);

      const fromHist = Array.isArray(hist?.data?.habitos_selecionados)
        ? (hist.data.habitos_selecionados as string[])
        : [];
      const fromOnb = Array.isArray(onb?.data?.respostas?.habitosSelecionados)
        ? (onb.data.respostas.habitosSelecionados as string[])
        : [];

      return {
        habitos: ((habitosRes?.data as any[]) ?? []),
        selecionados: (fromHist.length > 0 ? fromHist : fromOnb).filter(
          (t) => typeof t === "string" && t.trim(),
        ),
      };
    },
  });

  const journeyKey = jornadaType === "abstinência" ? "abst_" : "";

  return useMemo(() => {
    const habitos = data?.habitos ?? [];
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
    (data?.selecionados ?? []).forEach((t) => {
      if (seen.has(t)) return;
      const h = byTitle.get(t);
      if (h && !fixoIds.has(h.id)) {
        escolhidos.push(h);
        seen.add(t);
      }
    });
    escolhidos.sort(byPos);

    const escolhidoIds = new Set(escolhidos.map((h) => h.id));
    const restantes = habitos
      .filter((h) => !fixoIds.has(h.id) && !escolhidoIds.has(h.id))
      .sort(byPos);

    const toFoco = (h: any, isSelected: boolean): Foco => ({
      id: h.id,
      habito_titulo: h.habito_titulo,
      explicacao_missao: h.explicacao_missao ?? null,
      video_nome: h.video_nome ?? null,
      hipnose_nome: h.hipnose_nome ?? null,
      objetivo_chat_missao: h.objetivo_chat_missao ?? null,
      posicao: h.posicao != null ? Number(h.posicao) : null,
      tema_fixo: !!h.tema_fixo,
      hasVideo: h.video !== false,
      hasHipnose: h.hipnose !== false,
      hasMissao: h.missao !== false,
      isSelected,
    });

    const focos: Foco[] = [
      ...fixos.map((h) => toFoco(h, true)),
      ...escolhidos.map((h) => toFoco(h, true)),
    ];
    const todos: Foco[] = [...focos, ...restantes.map((h) => toFoco(h, false))];

    const isDone = (type: string) =>
      !!trackingData?.some((t) => t.interaction_type === type && t.finished_at !== null);

    const focoConcluido = (f: Foco, index: number) => {
      const pos = f.posicao ?? index + 1;
      const checks: boolean[] = [];
      if (f.hasVideo) checks.push(isDone(`${journeyKey}video_semana_${pos}`));
      if (f.hasHipnose) checks.push(isDone(`${journeyKey}hipnose_semana_${pos}`));
      if (f.hasMissao) checks.push(isDone(`${journeyKey}missao_semana_${pos}`));
      return checks.length > 0 && checks.every(Boolean);
    };

    const concluidos = focos.filter((f, i) => focoConcluido(f, i));
    const currentIndex = focos.findIndex((f, i) => !focoConcluido(f, i));
    const focoAtual =
      focos.length === 0
        ? null
        : currentIndex === -1
          ? focos[focos.length - 1]
          : focos[currentIndex];

    return {
      isLoading,
      focos,
      todosFocos: todos,
      focoAtual,
      // 1-based, nunca maior que o total
      focoAtualNumero: focos.length === 0 ? 0 : (currentIndex === -1 ? focos.length : currentIndex + 1),
      totalFocos: focos.length,
      totalTemasJornada: todos.length,
      focosConcluidos: concluidos.length,
      allCompleted: focos.length > 0 && concluidos.length === focos.length,
    };
  }, [data, trackingData, isLoading, journeyKey]);
}
