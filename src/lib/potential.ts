/** Average days in a month (365 / 12 ≈ 30.42), so 1 month ≈ 4.35 weeks. */
export const DAYS_PER_MONTH = 365 / 12;

/**
 * Monthly and yearly potential (cigarettes avoided and money saved).
 * The month is rounded first and the year is always exactly 12x the month,
 * so the numbers shown on screen always match.
 */
export function computePotential(cigsPerDay: number, weeklyCost: number) {
  const cigsMonth = Math.round(cigsPerDay * DAYS_PER_MONTH);
  const moneyMonth = Math.round((weeklyCost / 7) * DAYS_PER_MONTH);
  return {
    cigsMonth,
    cigsYear: cigsMonth * 12,
    moneyMonth,
    moneyYear: moneyMonth * 12,
  };
}
