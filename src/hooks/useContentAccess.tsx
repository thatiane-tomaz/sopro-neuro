import { useNavigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsFreelist } from "@/hooks/useIsFreelist";

/**
 * Acesso ao conteúdo do app (vídeos, hipnoses, missões e chat de IA).
 * Não existe conteúdo gratuito: é preciso assinatura ativa, estar na freelist
 * ou ser admin. O Dashboard e as abas continuam navegáveis sem acesso.
 */
export const useContentAccess = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { isPremium, loading: subLoading } = useSubscription();
  const { isFreelist, loading: freelistLoading } = useIsFreelist();

  const loading = adminLoading || subLoading || freelistLoading;
  const hasContentAccess = isAdmin || isPremium || isFreelist;

  /** Retorna true se pode seguir; caso contrário leva ao paywall. */
  const ensureContentAccess = () => {
    if (loading) return false;
    if (hasContentAccess) return true;
    navigate("/paywall");
    return false;
  };

  return { hasContentAccess, ensureContentAccess, loading };
};
