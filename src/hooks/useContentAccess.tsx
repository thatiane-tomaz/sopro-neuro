import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsFreelist } from "@/hooks/useIsFreelist";
import { trackEvent } from "@/lib/tracking";
import {
  canUseFreeSample,
  type FreeSampleClaims,
  type FreeSampleKind,
} from "@/lib/freeSamples";

export type SampleRequest = { kind: FreeSampleKind; id: string };

/**
 * Acesso ao conteúdo do app (hipnoses, missões, chat de IA e explicações).
 * Assinatura ativa, freelist ou admin liberam tudo. Sem assinatura, a pessoa
 * tem 1 hipnose, 1 conversa com o Neo e 1 explicação grátis: o primeiro
 * conteúdo de cada tipo que ela começar fica aberto; os demais levam ao paywall.
 */
export const useContentAccess = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { isPremium, loading: subLoading } = useSubscription();
  const { isFreelist, loading: freelistLoading } = useIsFreelist();

  const hasContentAccess = isAdmin || isPremium || isFreelist;
  const userId = user?.id ?? null;
  const claimsKey = ["free-content-claims", userId];

  const { data: claims = {}, isLoading: claimsLoading } = useQuery({
    queryKey: claimsKey,
    enabled: !!userId,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<FreeSampleClaims> => {
      const { data, error } = await supabase
        .from("free_content_claims" as any)
        .select("kind, content_identifier")
        .eq("user_id", userId!);
      if (error) {
        console.error("Erro ao carregar amostras grátis:", error);
        return {};
      }
      const out: FreeSampleClaims = {};
      for (const row of (data ?? []) as any[]) {
        out[row.kind as FreeSampleKind] = row.content_identifier;
      }
      return out;
    },
  });

  const loading = adminLoading || subLoading || freelistLoading || (!!userId && claimsLoading);

  const canUseSample = (sample: SampleRequest) =>
    hasContentAccess || canUseFreeSample(claims, sample.kind, sample.id);

  /** Registra o conteúdo grátis escolhido (só na primeira vez de cada tipo). */
  const claimSample = async (sample: SampleRequest) => {
    if (hasContentAccess || !userId) return;
    if (claims[sample.kind]) return;
    queryClient.setQueryData<FreeSampleClaims>(claimsKey, (old) => ({
      ...(old ?? {}),
      [sample.kind]: sample.id,
    }));
    const { error } = await supabase
      .from("free_content_claims" as any)
      .insert({ user_id: userId, kind: sample.kind, content_identifier: sample.id } as any);
    if (error) {
      // Conflito: outro conteúdo já foi registrado (ex.: outro aparelho)
      if ((error as any).code !== "23505") console.error("Erro ao registrar amostra:", error);
      queryClient.invalidateQueries({ queryKey: claimsKey });
      return;
    }
    trackEvent("content", `free_sample_${sample.kind}`);
  };

  /**
   * Retorna true se pode seguir; caso contrário leva ao paywall.
   * @param options.source rótulo do conteúdo bloqueado, para medir o funil
   * @param options.sample conteúdo que pode ser usado como amostra grátis
   * @param options.claim registra a amostra agora (padrão true)
   */
  const ensureContentAccess = (options?: {
    source?: string;
    sample?: SampleRequest;
    claim?: boolean;
  }) => {
    if (loading) return false;
    if (hasContentAccess) return true;
    if (options?.sample && canUseFreeSample(claims, options.sample.kind, options.sample.id)) {
      if (options.claim !== false) void claimSample(options.sample);
      return true;
    }
    trackEvent("content", `blocked_${options?.source ?? "unknown"}`);
    navigate("/paywall");
    return false;
  };

  return { hasContentAccess, ensureContentAccess, canUseSample, claimSample, loading };
};
