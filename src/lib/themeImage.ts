import { supabase } from "@/integrations/supabase/client";

/**
 * Imagens dos temas (habitos_jornada.imagem_nome) no bucket privado "images".
 * Como o bucket é privado, as imagens abrem por links assinados (com validade),
 * guardados em memória para não pedir o mesmo link várias vezes.
 * O nome pode vir sem extensão (ex: "onda"); nesse caso assume ".png".
 */
const BUCKET = "images";
const EXPIRES_IN = 60 * 60 * 24; // 24h
const REFRESH_BEFORE_MS = 60 * 60 * 1000; // renova 1h antes de vencer

const withExt = (name: string) =>
  /\.[a-z0-9]{2,5}$/i.test(name) ? name : `${name}.png`;

export function getThemeImagePath(name: string | null | undefined): string | null {
  const n = name?.trim();
  return n ? withExt(n) : null;
}

type CacheEntry = { promise: Promise<string | null>; expiresAt: number };
const cache = new Map<string, CacheEntry>();

function signed(path: string, size?: number): Promise<string | null> {
  const key = size ? `${path}@${size}` : path;
  const hit = cache.get(key);
  if (hit && hit.expiresAt - REFRESH_BEFORE_MS > Date.now()) return hit.promise;

  const promise = supabase.storage
    .from(BUCKET)
    .createSignedUrl(
      path,
      EXPIRES_IN,
      size ? { transform: { width: size, height: size, resize: "cover" } } : undefined,
    )
    .then(({ data, error }) => {
      if (error || !data?.signedUrl) {
        cache.delete(key);
        return null;
      }
      return data.signedUrl;
    })
    .catch(() => {
      cache.delete(key);
      return null;
    });

  cache.set(key, { promise, expiresAt: Date.now() + EXPIRES_IN * 1000 });
  return promise;
}

/** Link da versão reduzida (leve para miniaturas). */
export function getThemeImageThumbUrl(name: string | null | undefined, size = 160): Promise<string | null> {
  const path = getThemeImagePath(name);
  return path ? signed(path, size) : Promise.resolve(null);
}

/** Link do arquivo original — usado se a versão reduzida falhar. */
export function getThemeImageUrl(name: string | null | undefined): Promise<string | null> {
  const path = getThemeImagePath(name);
  return path ? signed(path) : Promise.resolve(null);
}
