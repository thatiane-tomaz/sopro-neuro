import { useNavigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsFreelist } from "@/hooks/useIsFreelist";
import { trackEvent } from "@/lib/tracking";

/**
 * Acesso ao conteúdo do app (vídeos, hipnoses, missões e chat de IA).
 * Requer assinatura ativa, freelist ou admin — exceto a amostra gratuita do
 * primeiro foco da jornada (`freePreview`), liberada para todo mundo para que
 * a pessoa experimente o método antes de decidir assinar.
 */
export const useContentAccess = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { isPremium, loading: subLoading } = useSubscription();
  const { isFreelist, loading: freelistLoading } = useIsFreelist();

  const loading = adminLoading || subLoading || freelistLoading;
  const hasContentAccess = isAdmin || isPremium || isFreelist;

  /**
   * Retorna true se pode seguir; caso contrário leva ao paywall.
   * @param options.freePreview conteúdo de amostra (primeiro foco) — sempre liberado
   * @param options.source rótulo do conteúdo bloqueado, para medir o funil
   */
  const ensureContentAccess = (options?: { freePreview?: boolean; source?: string }) => {
    if (loading) return false;
    if (hasContentAccess) return true;
    if (options?.freePreview) {
      trackEvent("content", `free_preview_${options.source ?? "unknown"}`);
      return true;
    }
    trackEvent("content", `blocked_${options?.source ?? "unknown"}`);
    navigate("/paywall");
    return false;
  };

  return { hasContentAccess, ensureContentAccess, loading };
};
