import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve uma URL assinada para um arquivo de mídia em bucket privado.
 * O nome salvo no banco pode vir sem extensão (ex: "liberdade_hipnose_tema1_onda")
 * ou com extensão/caixa diferente do arquivo real (ex: ".mp3" vs ".MP3", ".m4a").
 *
 * Estratégia:
 * 1. Lista o bucket e procura qualquer arquivo cujo nome base seja igual
 *    (ignorando caixa e extensão). Assim qualquer extensão funciona.
 * 2. Se a listagem falhar, tenta assinar variações conhecidas de extensão.
 */

const VIDEO_EXTS = [".mp4", ".MP4", ".mov", ".MOV", ".m4v", ".webm"];
const AUDIO_EXTS = [".mp3", ".MP3", ".m4a", ".M4A", ".wav", ".WAV", ".aac", ".ogg", ".opus"];

const stripExt = (name: string) => name.replace(/\.[a-z0-9]{2,5}$/i, "");
const normalize = (name: string) => stripExt(name.trim()).toLowerCase();

// cache de listagem por bucket+pasta para evitar requisições repetidas
const listCache = new Map<string, Promise<string[]>>();

async function listFiles(bucket: string, folder = ""): Promise<string[]> {
  const key = `${bucket}//${folder}`;
  if (!listCache.has(key)) {
    listCache.set(
      key,
      (async () => {
        const { data, error } = await supabase.storage
          .from(bucket)
          .list(folder, { limit: 1000 });
        if (error || !data) return [];
        return data.filter((f) => f.id).map((f) => (folder ? `${folder}/${f.name}` : f.name));
      })(),
    );
  }
  return listCache.get(key)!;
}

function buildCandidates(fileName: string, type: "video" | "hypnosis") {
  const base = fileName.trim();
  const exts = type === "video" ? VIDEO_EXTS : AUDIO_EXTS;
  const stem = stripExt(base);
  return Array.from(new Set([base, ...exts.map((e) => stem + e)]));
}

export async function getSignedMediaUrl(
  bucket: string,
  fileName: string | null | undefined,
  type: "video" | "hypnosis",
  fallbackBuckets: string[] = [],
): Promise<string | null> {
  if (!fileName) return null;

  const target = normalize(fileName);
  const requestedFolder = fileName.includes("/")
    ? fileName.slice(0, fileName.lastIndexOf("/"))
    : "";
  const buckets = Array.from(new Set([bucket, ...fallbackBuckets]));

  // 1. Resolução por listagem (aceita qualquer extensão)
  for (const b of buckets) {
    const folders = requestedFolder ? [requestedFolder, ""] : [""];
    for (const folder of folders) {
      const files = await listFiles(b, folder);
      const match = files.find((f) => {
        const leaf = f.slice(f.lastIndexOf("/") + 1);
        return normalize(leaf) === target.slice(target.lastIndexOf("/") + 1);
      });
      if (match) {
        const { data } = await supabase.storage.from(b).createSignedUrl(match, 60 * 60);
        if (data?.signedUrl) return data.signedUrl;
      }
    }
  }

  // 2. Fallback: tenta assinar variações de extensão diretamente
  const candidates = buildCandidates(fileName, type);
  for (const b of buckets) {
    for (const name of candidates) {
      const { data, error } = await supabase.storage.from(b).createSignedUrl(name, 60 * 60);
      if (!error && data?.signedUrl) return data.signedUrl;
    }
  }

  console.error("signed url not found for", buckets, fileName);
  return null;
}
