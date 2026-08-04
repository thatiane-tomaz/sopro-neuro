import { supabase } from "@/integrations/supabase/client";

/**
 * Vídeo de boas vindas ("Comece aqui").
 * Basta subir o arquivo no bucket privado `videos_2` com um destes nomes
 * (qualquer extensão de vídeo: .mp4, .mov, .webm...):
 *
 *  - comece_reducao   -> usuários que entraram na jornada de redução
 *  - comece_liberdade -> usuários que entraram na jornada de liberdade
 */
export type StartHereVideoKey = "comece_reducao" | "comece_liberdade";

export const startHereKeyForJornada = (jornadaInicial?: string | null): StartHereVideoKey =>
  jornadaInicial === "abstinencia" || jornadaInicial === "liberdade"
    ? "comece_liberdade"
    : "comece_reducao";

export async function getStartHereVideoUrl(key: StartHereVideoKey): Promise<string | null> {
  const { data: files, error } = await supabase.storage
    .from("videos_2")
    .list("", { limit: 500 });
  if (error) {
    console.error("start here list error", error);
    return null;
  }
  const match = (files ?? []).find(
    (f) => f.name === key || f.name.startsWith(`${key}.`)
  );
  if (!match) return null;
  const { data, error: signErr } = await supabase.storage
    .from("videos_2")
    .createSignedUrl(match.name, 60 * 60);
  if (signErr || !data?.signedUrl) {
    console.error("start here signed url error", signErr);
    return null;
  }
  return data.signedUrl;
}
