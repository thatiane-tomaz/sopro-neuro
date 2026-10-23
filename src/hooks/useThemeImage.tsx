import { useCallback, useEffect, useState } from "react";
import { getThemeImagePath, getThemeImageThumbUrl, getThemeImageUrl } from "@/lib/themeImage";

/**
 * Link de uma imagem de tema: tenta a versão reduzida e, se ela não abrir,
 * cai para o arquivo original. `failed` fica true quando nenhuma abre.
 */
export function useThemeImage(name: string | null | undefined, size = 160) {
  const path = getThemeImagePath(name);
  const [src, setSrc] = useState<string | null>(null);
  const [usingOriginal, setUsingOriginal] = useState(false);
  const [failed, setFailed] = useState(!path);

  useEffect(() => {
    let alive = true;
    setSrc(null);
    setUsingOriginal(false);
    setFailed(!path);
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
  }, [path, size, name]);

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
