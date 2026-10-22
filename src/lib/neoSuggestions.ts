/** Pergunta fixa nas sugestões do Neo durante as 2 primeiras semanas de uso. */
export const METODO_QUESTION = "Como funciona o método Sopro?";
export const METODO_QUESTION_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Sugestões do bloco do Neo: nas 2 primeiras semanas desde a criação da conta,
 * a primeira é sempre "Como funciona o método Sopro?"; depois vêm as sorteadas.
 */
export function buildNeoSuggestions(
  sorteadas: string[],
  accountCreatedAt: string | null | undefined,
  now: number = Date.now(),
): string[] {
  const created = accountCreatedAt ? new Date(accountCreatedAt).getTime() : NaN;
  const inFirstWeeks = !isNaN(created) && now - created < METODO_QUESTION_DAYS * DAY_MS;
  if (!inFirstWeeks) return sorteadas;
  return [METODO_QUESTION, ...sorteadas.filter((s) => s.trim() !== METODO_QUESTION)];
}
