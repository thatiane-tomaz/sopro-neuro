import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve uma URL assinada para um arquivo de mídia em bucket privado.
 * O nome salvo no banco pode vir sem extensão (ex: "liberdade_hipnose_tema1_onda")
 * ou com a extensão em caixa diferente do arquivo real (ex: ".mp3" vs ".MP3").
 * Testamos todas as variações antes de desistir.
 */
function buildCandidates(fileName: string, type: "video" | "hypnosis") {
  const base = fileName.trim();
  const exts =
    type === "video"
      ? [".mp4", ".MP4", ".mov", ".MOV", ".m4v", ".webm"]
      : [".mp3", ".MP3", ".m4a", ".M4A", ".wav", ".aac"];

  const extMatch = base.match(/\.([a-z0-9]{2,4})$/i);
  if (!extMatch) {
    return [base, ...exts.map((e) => base + e)];
  }

  // Já tem extensão: tenta como está e também as variações de caixa/formato
  const stem = base.slice(0, -extMatch[0].length);
  const variants = [
    base,
    stem + extMatch[0].toLowerCase(),
    stem + extMatch[0].toUpperCase(),
    ...exts.map((e) => stem + e),
  ];
  return Array.from(new Set(variants));
}

export async function getSignedMediaUrl(
  bucket: string,
  fileName: string | null | undefined,
  type: "video" | "hypnosis",
  fallbackBuckets: string[] = [],
): Promise<string | null> {
  if (!fileName) return null;
  const candidates = buildCandidates(fileName, type);
  const buckets = [bucket, ...fallbackBuckets];

  for (const b of buckets) {
    for (const name of candidates) {
      const { data, error } = await supabase.storage
        .from(b)
        .createSignedUrl(name, 60 * 60);
      if (!error && data?.signedUrl) return data.signedUrl;
    }
  }

  console.error("signed url not found for", buckets, fileName);
  return null;
}
