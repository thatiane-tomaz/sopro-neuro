import type { JourneyId } from "./journeyFocus";
import { differenceInCalendarDays, isValid, parseISO } from "date-fns";

export interface ProgressModeInput {
  onboardingJourney: JourneyId;
  /** Data do ritual do último cigarro (YYYY-MM-DD) ou null. */
  ritualDate: string | null;
  logs: { log_date: string; cigarettes_count: number }[];
}

/**
 * Regras da aba Progresso:
 * - Abstinência no onboarding ou data do ritual salva → layout Liberdade.
 * - O 0 automático no gráfico vale a partir do ritual; quem veio da
 *   abstinência sem data tem 0 automático desde o início.
 * - Redução sem ritual mas com algum dia de 0 cigarros → mostra a contagem,
 *   sem 0 automático.
 * - Sem ritual, conta todos os dias distintos registrados com zero; isso não
 *   confirma abstinência contínua nem informa uma data do último cigarro.
 */
export function computeProgressMode({ onboardingJourney, ritualDate, logs }: ProgressModeInput) {
  const layout: JourneyId = onboardingJourney === "abstinencia" || ritualDate ? "abstinencia" : "reducao";
  const autoZero = layout === "abstinencia";
  const autoZeroFrom: string | null = ritualDate ?? null; // null = desde o início

  const sorted = [...logs].sort((a, b) => a.log_date.localeCompare(b.log_date));
  const lastSmoked = sorted.filter((l) => l.cigarettes_count > 0).pop()?.log_date ?? null;

  let counterStart: string | null = null;
  const recordedSmokeFreeDays = new Set(
    logs.filter((log) => log.cigarettes_count === 0).map((log) => log.log_date),
  ).size;
  if (ritualDate) {
    counterStart = lastSmoked && lastSmoked > ritualDate ? lastSmoked : ritualDate;
  }

  return {
    layout,
    autoZero,
    autoZeroFrom,
    showCounter: counterStart !== null || recordedSmokeFreeDays > 0,
    counterStart,
    recordedSmokeFreeDays,
    askRitualDate: !ritualDate,
  };
}

/** O popup de cigarros de ontem só aparece para quem não tem data do ritual. */
export const shouldAskYesterday = (ritualDate: string | null) => !ritualDate;

/** Após o ritual usa dias de calendário; os zeros anteriores não são somados. */
export function countSmokeFreeDays(mode: ReturnType<typeof computeProgressMode>, today: Date): number | null {
  if (!mode.showCounter) return null;
  if (!mode.counterStart) return mode.recordedSmokeFreeDays;
  const start = parseISO(mode.counterStart);
  if (!isValid(start) || !isValid(today)) return null;
  const days = differenceInCalendarDays(today, start);
  return days >= 0 ? days : null;
}
