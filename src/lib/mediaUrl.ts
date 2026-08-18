import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve uma URL assinada para um arquivo de mídia em bucket privado.
 * O nome salvo em habitos_jornada pode vir sem extensão (ex: "liberdade_hipnose_tema1_onda"),
 * enquanto o arquivo no bucket tem extensão (ex: ".MP3"). Testamos variações.
 */
export async function getSignedMediaUrl(
  bucket: string,
  fileName: string | null | undefined,
  type: "video" | "hypnosis",
): Promise<string | null> {
  if (!fileName) return null;
  const base = fileName.trim();
  const hasExt = /\.[a-z0-9]{2,4}$/i.test(base);
  const exts =
    type === "video"
      ? [".mp4", ".MP4", ".mov", ".MOV", ".m4v", ".webm"]
      : [".mp3", ".MP3", ".m4a", ".M4A", ".wav", ".aac"];
  const candidates = hasExt ? [base] : [base, ...exts.map((e) => base + e)];

  for (const name of candidates) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(name, 60 * 60);
    if (!error && data?.signedUrl) return data.signedUrl;
  }
  console.error("signed url not found for", bucket, base);
  return null;
}
