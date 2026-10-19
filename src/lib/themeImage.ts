import { supabase } from "@/integrations/supabase/client";

/**
 * URLs das imagens dos temas (habitos_jornada.imagem_nome) no bucket público "images".
 * O nome pode vir sem extensão (ex: "onda"); nesse caso assume ".png".
 */
const BUCKET = "images";

const withExt = (name: string) =>
  /\.[a-z0-9]{2,5}$/i.test(name) ? name : `${name}.png`;

export function getThemeImagePath(name: string | null | undefined): string | null {
  const n = name?.trim();
  return n ? withExt(n) : null;
}

/** Versão reduzida (redimensionada pelo storage) — leve para miniaturas. */
export function getThemeImageThumbUrl(name: string | null | undefined, size = 160): string | null {
  const path = getThemeImagePath(name);
  if (!path) return null;
  return supabase.storage
    .from(BUCKET)
    .getPublicUrl(path, { transform: { width: size, height: size, resize: "cover" } }).data.publicUrl;
}

/** Arquivo original — usado como fallback se a versão reduzida falhar. */
export function getThemeImageUrl(name: string | null | undefined): string | null {
  const path = getThemeImagePath(name);
  if (!path) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
