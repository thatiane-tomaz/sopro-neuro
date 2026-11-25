export type JourneyId = "reducao" | "abstinencia";

/** Prefixo das chaves de progresso de cada jornada (journey_tracking). */
export const journeyPrefix = (j: JourneyId) => (j === "abstinencia" ? "abst_" : "");

/** Normaliza valores salvos ("abstinência", "liberdade", ...) para JourneyId. */
export const toJourneyId = (raw: string | null | undefined): JourneyId =>
  raw === "abstinencia" || raw === "abstinência" || raw === "liberdade" ? "abstinencia" : "reducao";

export interface PickFocusInput<T> {
  temas: Record<JourneyId, T[]>;
  isDone: (journey: JourneyId, tema: T, index: number) => boolean;
  onboardingJourney: JourneyId;
  lastChosenJourney?: JourneyId | null;
}

/**
 * Tema indicado no Dash: primeiro tema não concluído da última jornada que a
 * pessoa escolheu (ou da jornada do onboarding, se nunca escolheu outra).
 * Se essa jornada estiver toda concluída, cai para a outra.
 */
export function pickFocus<T>({ temas, isDone, onboardingJourney, lastChosenJourney }: PickFocusInput<T>) {
  const preferred = lastChosenJourney ?? onboardingJourney;
  const other: JourneyId = preferred === "reducao" ? "abstinencia" : "reducao";
  for (const journey of [preferred, other]) {
    const list = temas[journey] ?? [];
    const index = list.findIndex((t, i) => !isDone(journey, t, i));
    if (index !== -1) return { journey, tema: list[index], index };
  }
  const list = temas[preferred] ?? [];
  if (list.length === 0) return null;
  return { journey: preferred, tema: list[list.length - 1], index: list.length - 1 };
}
