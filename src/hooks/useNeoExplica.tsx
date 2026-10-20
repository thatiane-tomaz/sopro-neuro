import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  filterForJornada,
  pickNeoExplica,
  sortSlideNames,
  type NeoExplicaJornada,
} from "@/lib/neoExplica";

export const NEO_EXPLICA_BUCKET = "neo-explica";

export type NeoExplica = {
  id: string;
  titulo: string;
  pasta: string;
  jornada: string | null;
  ordem: number;
  segundos_por_imagem: number;
};

/** Explicação que aparece agora no card do Neo Explica (troca a cada 2 dias ou ao abrir). */
export const useNeoExplica = (jornada: NeoExplicaJornada) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;
  const queryKey = ["neo-explica", userId, jornada];

  const query = useQuery({
    queryKey,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<NeoExplica | null> => {
      const db = supabase as any;
      const [itemsRes, stateRes, viewsRes] = await Promise.all([
        db.from("neo_explica").select("id, titulo, pasta, jornada, ordem, segundos_por_imagem").eq("ativo", true),
        db.from("neo_explica_estado").select("explica_id, exibido_em").eq("user_id", userId).maybeSingle(),
        db.from("neo_explica_views").select("explica_id, aberto_em").eq("user_id", userId),
      ]);
      if (itemsRes.error) {
        console.error("Erro ao carregar Neo Explica:", itemsRes.error);
        return null;
      }
      const list = filterForJornada((itemsRes.data ?? []) as NeoExplica[], jornada);
      const state = stateRes.data
        ? { explicaId: stateRes.data.explica_id as string | null, shownAt: stateRes.data.exibido_em as string }
        : null;
      const views = ((viewsRes.data ?? []) as any[]).map((v) => ({
        explicaId: v.explica_id as string,
        openedAt: v.aberto_em as string,
      }));
      const pick = pickNeoExplica(list, state, views, Date.now());
      if (!pick) return null;
      if (pick.changed) {
        const { error } = await db
          .from("neo_explica_estado")
          .upsert({ user_id: userId, explica_id: pick.explicaId, exibido_em: pick.shownAt }, { onConflict: "user_id" });
        if (error) console.error("Erro ao salvar Neo Explica atual:", error);
      }
      return list.find((i) => i.id === pick.explicaId) ?? null;
    },
  });

  /** Registra a abertura; devolve o id do registro para marcar a conclusão. */
  const markOpened = async (explicaId: string): Promise<string | null> => {
    if (!userId) return null;
    const { data, error } = await (supabase as any)
      .from("neo_explica_views")
      .insert({ user_id: userId, explica_id: explicaId })
      .select("id")
      .single();
    if (error) {
      console.error("Erro ao registrar Neo Explica aberto:", error);
      return null;
    }
    return data?.id ?? null;
  };

  const markCompleted = async (viewId: string) => {
    const { error } = await (supabase as any)
      .from("neo_explica_views")
      .update({ concluido_em: new Date().toISOString() })
      .eq("id", viewId);
    if (error) console.error("Erro ao registrar Neo Explica concluído:", error);
  };

  /** Recalcula o card (troca para a próxima depois de abrir). */
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["neo-explica", userId] });

  return { explica: query.data ?? null, loading: query.isLoading, markOpened, markCompleted, refresh };
};

/** URLs assinadas das imagens da pasta, na ordem do nome do arquivo. */
export const loadNeoExplicaSlides = async (pasta: string): Promise<string[]> => {
  const folder = pasta.trim().replace(/^\/+|\/+$/g, "");
  const { data, error } = await supabase.storage
    .from(NEO_EXPLICA_BUCKET)
    .list(folder, { limit: 100, sortBy: { column: "name", order: "asc" } });
  if (error || !data) {
    console.error("Erro ao listar imagens do Neo Explica:", error);
    return [];
  }
  const names = sortSlideNames(data.filter((f) => f.id).map((f) => f.name));
  if (names.length === 0) return [];
  const paths = names.map((n) => (folder ? `${folder}/${n}` : n));
  const { data: signed, error: signError } = await supabase.storage
    .from(NEO_EXPLICA_BUCKET)
    .createSignedUrls(paths, 60 * 60);
  if (signError || !signed) {
    console.error("Erro ao assinar imagens do Neo Explica:", signError);
    return [];
  }
  return signed.map((s) => s.signedUrl).filter(Boolean) as string[];
};
