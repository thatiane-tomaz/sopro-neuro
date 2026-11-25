import type { JourneyId } from "./journeyFocus";

export interface ProgressModeInput {
  onboardingJourney: JourneyId;
  /** Data do ritual do último cigarro (YYYY-MM-DD) ou null. */
  ritualDate: string | null;
  logs: { log_date: string; cigarettes_count: number }[];
}

const dayBefore = (ds: string) => {
  const d = new Date(ds + "T00:00:00");
  d.setDate(d.getDate() - 1);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/**
 * Regras da aba Progresso:
 * - Abstinência no onboarding ou data do ritual salva → layout Liberdade.
 * - O 0 automático no gráfico vale a partir do ritual; quem veio da
 *   abstinência sem data tem 0 automático desde o início.
 * - Redução sem ritual mas com algum dia de 0 cigarros → mostra a contagem,
 *   sem 0 automático.
 * - Sem ritual, só contam dias consecutivos explicitamente registrados com
 *   zero, encerrados no registro mais recente; lacunas não confirmam abstinência.
 */
export function computeProgressMode({ onboardingJourney, ritualDate, logs }: ProgressModeInput) {
  const layout: JourneyId = onboardingJourney === "abstinencia" || ritualDate ? "abstinencia" : "reducao";
  const autoZero = layout === "abstinencia";
  const autoZeroFrom: string | null = ritualDate ?? null; // null = desde o início

  const sorted = [...logs].sort((a, b) => a.log_date.localeCompare(b.log_date));
  const lastSmoked = sorted.filter((l) => l.cigarettes_count > 0).pop()?.log_date ?? null;

  let counterStart: string | null = null;
  let recordedSmokeFreeDays = 0;
  if (ritualDate) {
    counterStart = lastSmoked && lastSmoked > ritualDate ? lastSmoked : ritualDate;
  } else {
    let expectedDate = sorted.at(-1)?.log_date;
    for (let i = sorted.length - 1; i >= 0; i--) {
      const log = sorted[i];
      if (log.cigarettes_count !== 0 || log.log_date !== expectedDate) break;
      recordedSmokeFreeDays++;
      counterStart = dayBefore(log.log_date);
      expectedDate = counterStart;
    }
  }

  return {
    layout,
    autoZero,
    autoZeroFrom,
    showCounter: counterStart !== null,
    counterStart,
    recordedSmokeFreeDays,
    zeroRunStart: !ritualDate && recordedSmokeFreeDays > 0
      ? sorted[sorted.length - recordedSmokeFreeDays].log_date : null,
    askRitualDate: !ritualDate,
  };
}

/** O popup de cigarros de ontem só aparece para quem não tem data do ritual. */
export const shouldAskYesterday = (ritualDate: string | null) => !ritualDate;
