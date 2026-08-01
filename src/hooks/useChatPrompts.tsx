import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PromptCategoria = "gancho_neo" | "abstinencia" | "reducao";

interface ChatPromptRow {
  id: string;
  categoria: string;
  mensagem: string;
  ordem: number;
}

/** Random seed created once per app entry (page load / session start). */
const SESSION_SEED = Math.random();

function pickRandom<T>(arr: T[], count: number, seed: number): T[] {
  if (arr.length === 0) return [];
  const pool = [...arr];
  const out: T[] = [];
  let s = seed;
  while (out.length < Math.min(count, arr.length)) {
    s = (s * 9301 + 49297) % 233280;
    const idx = Math.floor((s / 233280) * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

/**
 * Neo hook message + 3 suggested questions, rotating on every app entry.
 * Questions vary by journey (redução vs abstinência).
 */
export function useChatPrompts(isAbstinencia: boolean) {
  const { data } = useQuery({
    queryKey: ["chat-prompts"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("chat_prompts")
        .select("id, categoria, mensagem, ordem")
        .eq("ativo", true)
        .order("ordem");
      if (error) throw error;
      return (data ?? []) as ChatPromptRow[];
    },
    staleTime: 30 * 60 * 1000,
  });

  return useMemo(() => {
    const rows = data ?? [];
    const ganchos = rows.filter((r) => r.categoria === "gancho_neo").map((r) => r.mensagem);
    const cat: PromptCategoria = isAbstinencia ? "abstinencia" : "reducao";
    const perguntas = rows.filter((r) => r.categoria === cat).map((r) => r.mensagem);

    const seedA = Math.floor(SESSION_SEED * 200000) + 1;
    const seedB = Math.floor(SESSION_SEED * 90000) + 7;

    return {
      gancho: pickRandom(ganchos, 1, seedA)[0],
      sugestoes: pickRandom(perguntas, 3, seedB),
      loading: !data,
    };
  }, [data, isAbstinencia]);
}
