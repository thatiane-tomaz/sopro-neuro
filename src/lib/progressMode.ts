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
 * - A contagem parte do último dia em que fumou (registro > 0), do ritual ou
 *   do dia anterior ao primeiro registro 0.
 */
export function computeProgressMode({ onboardingJourney, ritualDate, logs }: ProgressModeInput) {
  const layout: JourneyId = onboardingJourney === "abstinencia" || ritualDate ? "abstinencia" : "reducao";
  const autoZero = layout === "abstinencia";
  const autoZeroFrom: string | null = ritualDate ?? null; // null = desde o início

  const sorted = [...logs].sort((a, b) => a.log_date.localeCompare(b.log_date));
  const zeroLogs = sorted.filter((l) => l.cigarettes_count === 0);
  const lastSmoked = sorted.filter((l) => l.cigarettes_count > 0).pop()?.log_date ?? null;

  let counterStart: string | null = null;
  if (ritualDate) {
    counterStart = lastSmoked && lastSmoked > ritualDate ? lastSmoked : ritualDate;
  } else if (zeroLogs.length > 0) {
    const firstZero = zeroLogs[0].log_date;
    counterStart = lastSmoked && lastSmoked >= firstZero ? lastSmoked : dayBefore(firstZero);
  }

  return {
    layout,
    autoZero,
    autoZeroFrom,
    showCounter: counterStart !== null,
    counterStart,
    askRitualDate: !ritualDate,
  };
}

/** O popup de cigarros de ontem só aparece para quem não tem data do ritual. */
export const shouldAskYesterday = (ritualDate: string | null) => !ritualDate;
