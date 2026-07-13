export const DAILY_CHAT_PROMPTS = [
  "Como foi sua vontade de fumar hoje?",
  "O que desperta sua vontade de fumar?",
  "Vamos aliviar essa tensão?",
  "O que recarrega sua energia?",
  "Será que você quer nicotina mesmo?",
  "O que te dá prazer além do cigarro?",
  "Vamos criar um novo hábito saudável?",
] as const;

/**
 * Returns the prompt for today, deterministic per calendar day
 * (America/Sao_Paulo). Rotates through the 7 prompts.
 */
export function getDailyChatPrompt(date: Date = new Date()): string {
  // Days since Unix epoch in local time — same day = same prompt.
  const dayIndex = Math.floor(
    (date.getTime() - date.getTimezoneOffset() * 60_000) / 86_400_000,
  );
  const idx = ((dayIndex % DAILY_CHAT_PROMPTS.length) + DAILY_CHAT_PROMPTS.length) %
    DAILY_CHAT_PROMPTS.length;
  return DAILY_CHAT_PROMPTS[idx];
}