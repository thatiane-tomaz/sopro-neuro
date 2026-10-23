import { useCallback, useEffect, useState } from "react";
import { getThemeImagePath, getThemeImageThumbUrl, getThemeImageUrl } from "@/lib/themeImage";

/**
 * Link de uma imagem de tema: tenta a versão reduzida e, se ela não abrir,
 * cai para o arquivo original. `failed` fica true quando nenhuma abre.
 */
export function useThemeImage(name: string | null | undefined, size = 160) {
  // Endereço já pronto (ex.: imagem local nas telas de exemplo): usa direto.
  const direct = name && /^(https?:|data:|blob:|\/)/.test(name) ? name : null;
  const path = direct ? null : getThemeImagePath(name);
  const [src, setSrc] = useState<string | null>(direct);
  const [usingOriginal, setUsingOriginal] = useState(false);
  const [failed, setFailed] = useState(!path && !direct);

  useEffect(() => {
    let alive = true;
    setSrc(direct);
    setUsingOriginal(Boolean(direct));
    setFailed(!path && !direct);
    if (!path) return;
    getThemeImageThumbUrl(name, size).then(async (thumb) => {
      if (!alive) return;
      if (thumb) return setSrc(thumb);
      const original = await getThemeImageUrl(name);
      if (!alive) return;
      setUsingOriginal(true);
      if (original) setSrc(original);
      else setFailed(true);
    });
    return () => {
      alive = false;
    };
  }, [path, size, name, direct]);

  const onError = useCallback(() => {
    if (usingOriginal) {
      setFailed(true);
      return;
    }
    setUsingOriginal(true);
    getThemeImageUrl(name).then((original) => {
      if (original) setSrc(original);
      else setFailed(true);
    });
  }, [usingOriginal, name]);

  return { src, failed, onError };
}
