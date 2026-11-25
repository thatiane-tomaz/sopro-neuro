import type { JourneyId } from "./journeyFocus";

export const INTENSIVE_DAYS = 7;

export function orderIntensiveDays<T extends { posicao: string | number | null }>(days: T[]): T[] {
  return days
    .filter((day) => Number(day.posicao) >= 1 && Number(day.posicao) <= INTENSIVE_DAYS)
    .sort((a, b) => Number(a.posicao) - Number(b.posicao));
}

export const JOURNEYS: { id: JourneyId; title: string; subtitle: string }[] = [
  {
    id: "reducao",
    title: "Enfraquecendo o vício",
    subtitle: "Para quem quer reduzir os cigarros até decidir parar totalmente.",
  },
  {
    id: "abstinencia",
    title: "Superando a abstinência",
    subtitle: "Para quem já parou de fumar e quer fortalecer a decisão e superar a vontade.",
  },
  {
    id: "ultimo_cigarro",
    title: "7 Dias para o Último Cigarro",
    subtitle: "Uma jornada intensiva para enfraquecer o vício e conseguir parar de fumar em 7 dias.",
  },
];

interface ContentMetadata {
  video?: boolean;
  video_nome?: string | null;
  hipnose?: boolean;
  hipnose_nome?: string | null;
  missao?: boolean;
}

export function getJourneyContentFlags(journey: JourneyId, content: ContentMetadata) {
  const intensive = journey === "ultimo_cigarro";
  return {
    hasVideo: intensive && content.video !== false && !!content.video_nome?.trim(),
    hasHipnose: content.hipnose !== false && !!content.hipnose_nome?.trim(),
    hasMissao: !intensive && content.missao !== false,
    hasMural: !intensive,
  };
}

export const journeyVideoBucket = (journey: JourneyId) =>
  journey === "ultimo_cigarro" ? "videos" : "videos_2";

/** Um dia intensivo só termina quando vídeo e hipnose terminam. */
export function isJourneyContentCompleted(
  content: { hasVideo: boolean; hasHipnose: boolean; hasMissao: boolean },
  done: { video: boolean; hipnose: boolean; missao: boolean },
) {
  const checks = [
    ...(content.hasVideo ? [done.video] : []),
    ...(content.hasHipnose ? [done.hipnose] : []),
    ...(content.hasMissao ? [done.missao] : []),
  ];
  return checks.length > 0 && checks.every(Boolean);
}