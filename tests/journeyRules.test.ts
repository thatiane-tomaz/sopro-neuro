import { describe, expect, test } from "bun:test";
import { pickFocus } from "../src/lib/journeyFocus";
import { computeProgressMode, shouldAskYesterday } from "../src/lib/progressMode";

const temas = { reducao: ["r1", "r2"], abstinencia: ["a1", "a2"] };

describe("tema indicado no Dash", () => {
  test("começa pelo primeiro tema da jornada do onboarding", () => {
    expect(pickFocus({ temas, isDone: () => false, onboardingJourney: "abstinencia" })?.tema).toBe("a1");
  });
  test("segue a última jornada escolhida, primeiro tema não visto", () => {
    const done = new Set(["r1"]);
    const r = pickFocus({ temas, isDone: (_, t) => done.has(t), onboardingJourney: "abstinencia", lastChosenJourney: "reducao" });
    expect(r?.tema).toBe("r2");
  });
});

describe("Progresso", () => {
  test("redução sem ritual nem 0: layout redução, sem contagem", () => {
    const m = computeProgressMode({ onboardingJourney: "reducao", ritualDate: null, logs: [{ log_date: "2026-11-01", cigarettes_count: 5 }] });
    expect([m.layout, m.showCounter, m.autoZero]).toEqual(["reducao", false, false]);
  });
  test("redução com ritual vira liberdade com 0 automático a partir da data", () => {
    const m = computeProgressMode({ onboardingJourney: "reducao", ritualDate: "2026-11-10", logs: [] });
    expect([m.layout, m.autoZero, m.autoZeroFrom, m.counterStart]).toEqual(["abstinencia", true, "2026-11-10", "2026-11-10"]);
  });
  test("redução com 0 registrado mostra contagem sem 0 automático", () => {
    const m = computeProgressMode({ onboardingJourney: "reducao", ritualDate: null, logs: [{ log_date: "2026-11-05", cigarettes_count: 3 }, { log_date: "2026-11-06", cigarettes_count: 0 }] });
    expect([m.layout, m.showCounter, m.autoZero, m.counterStart, m.recordedSmokeFreeDays]).toEqual(["reducao", true, false, null, 1]);
  });
  test("abstinência continua liberdade mesmo registrando que fumou", () => {
    const m = computeProgressMode({ onboardingJourney: "abstinencia", ritualDate: "2026-11-01", logs: [{ log_date: "2026-11-08", cigarettes_count: 2 }] });
    expect([m.layout, m.autoZero, m.counterStart]).toEqual(["abstinencia", true, "2026-11-08"]);
  });
  test("popup de ontem só sem data do ritual", () => {
    expect(shouldAskYesterday(null)).toBe(true);
    expect(shouldAskYesterday("2026-11-01")).toBe(false);
  });
  test("todos os dias de zero continuam contando após um registro de cigarro, sem presumir ritual", () => {
    const m = computeProgressMode({ onboardingJourney: "reducao", ritualDate: null, logs: [
      { log_date: "2026-10-27", cigarettes_count: 0 },
      { log_date: "2026-10-28", cigarettes_count: 0 },
      { log_date: "2026-11-04", cigarettes_count: 1 },
      { log_date: "2026-11-24", cigarettes_count: 1 },
    ] });
    expect([m.showCounter, m.counterStart, m.recordedSmokeFreeDays, m.askRitualDate, m.autoZero]).toEqual([true, null, 2, true, false]);
  });
  test("zero sem ritual soma todos os dias registrados, mesmo não consecutivos", () => {
    const m = computeProgressMode({ onboardingJourney: "reducao", ritualDate: null, logs: [
      { log_date: "2026-10-25", cigarettes_count: 0 },
      { log_date: "2026-10-27", cigarettes_count: 0 },
      { log_date: "2026-10-28", cigarettes_count: 0 },
    ] });
    expect([m.recordedSmokeFreeDays, m.counterStart, m.askRitualDate, m.autoZero]).toEqual([3, null, true, false]);
  });
  test("o mesmo dia não conta duas vezes", () => {
    const m = computeProgressMode({ onboardingJourney: "reducao", ritualDate: null, logs: [
      { log_date: "2026-10-25", cigarettes_count: 0 },
      { log_date: "2026-10-25", cigarettes_count: 0 },
    ] });
    expect(m.recordedSmokeFreeDays).toBe(1);
  });
});
