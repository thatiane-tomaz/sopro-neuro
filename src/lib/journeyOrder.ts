import type { JourneyId } from "./journeyFocus";

export interface JourneyOrderInput {
  onboardingJourney: JourneyId;
  /** Data do ritual do último cigarro (YYYY-MM-DD) ou null. */
  ritualDate: string | null;
  logs: { log_date: string; cigarettes_count: number }[];
}

const REDUCAO_FIRST: JourneyId[] = ["reducao", "ultimo_cigarro", "abstinencia"];
const LIBERDADE_FIRST: JourneyId[] = ["abstinencia", "reducao", "ultimo_cigarro"];
const INTENSIVO_FIRST: JourneyId[] = ["ultimo_cigarro", "reducao", "abstinencia"];

/** Dias distintos com 0 cigarros registrados (quem reduz sem ritual). */
export function zeroSmokeDays(logs: { log_date: string; cigarettes_count: number }[]): number {
  return new Set(logs.filter((l) => l.cigarettes_count === 0).map((l) => l.log_date)).size;
}

/**
 * Ordem das jornadas na aba Jornadas:
 * - Abstinência no onboarding ou data do ritual → Liberdade primeiro.
 * - Redução com 5+ dias marcados com 0 cigarros → Intensivo primeiro.
 * - Redução → Redução, Intensivo, Liberdade.
 */
export function orderJourneys({
  onboardingJourney,
  ritualDate,
  logs,
}: JourneyOrderInput): JourneyId[] {
  if (onboardingJourney === "abstinencia" || ritualDate) return [...LIBERDADE_FIRST];
  if (zeroSmokeDays(logs) >= 5) return [...INTENSIVO_FIRST];
  return [...REDUCAO_FIRST];
}
