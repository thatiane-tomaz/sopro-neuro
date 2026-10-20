/**
 * Amostras grátis para quem não tem assinatura:
 * 1 hipnose, 1 conversa com o Neo e 1 explicação.
 * O primeiro conteúdo de cada tipo que a pessoa começa fica liberado
 * para sempre; qualquer outro do mesmo tipo leva ao paywall.
 */
export type FreeSampleKind = "hipnose" | "neo" | "explicacao";

export type FreeSampleClaims = Partial<Record<FreeSampleKind, string>>;

export const canUseFreeSample = (
  claims: FreeSampleClaims,
  kind: FreeSampleKind,
  contentId: string,
): boolean => {
  const claimed = claims[kind];
  return !claimed || claimed === contentId;
};

// Identificadores estáveis de cada conteúdo
export const hypnosisSampleId = (fileName: string | null | undefined) =>
  `hipnose:${(fileName ?? "").trim().replace(/\.[a-z0-9]{2,5}$/i, "").toLowerCase()}`;
export const SOS_SAMPLE_ID = "hipnose:sos";
export const missionSampleId = (habitoId: string | null | undefined) => `missao:${habitoId ?? ""}`;
export const newFreeChatSampleId = () =>
  `livre:${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Date.now()}`;
export const videoSampleId = (fileName: string | null | undefined) =>
  `video:${(fileName ?? "").trim().replace(/\.[a-z0-9]{2,5}$/i, "").toLowerCase()}`;
