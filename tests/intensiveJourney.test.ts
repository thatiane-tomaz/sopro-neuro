import { describe, expect, test } from "bun:test";
import { JOURNEY_IDS, journeyPrefix, pickFocus, toJourneyId } from "../src/lib/journeyFocus";
import { getJourneyContentFlags, INTENSIVE_DAYS, isJourneyContentCompleted, journeyVideoBucket, orderIntensiveDays } from "../src/lib/journeys";

const flags = getJourneyContentFlags("ultimo_cigarro", {
  video: true, video_nome: "video_dia1.mp4", hipnose: true, hipnose_nome: "hipnose_dia1.mp3", missao: true,
});

describe("jornada intensiva", () => {
  test("sete dias, após Redução e Liberdade", () => {
    expect(INTENSIVE_DAYS).toBe(7);
    expect(JOURNEY_IDS).toEqual(["reducao", "abstinencia", "ultimo_cigarro"]);
  });
  test("cada dia tem vídeo e hipnose, nunca missão ou mural", () => {
    expect(flags).toEqual({ hasVideo: true, hasHipnose: true, hasMissao: false, hasMural: false });
  });
  test("arquivos são ordenados por dia de 1 a 7, mesmo fora de ordem no retorno", () => {
    const days = [7, 3, 1, 6, 2, 5, 4, 8].map((day) => ({
      posicao: String(day), video_nome: `video_dia${day}.mp4`, hipnose_nome: `hipnose_dia${day}.mp3`,
    }));
    const ordered = orderIntensiveDays(days);
    expect(ordered.map((day) => day.video_nome)).toEqual([
      "video_dia1.mp4", "video_dia2.mp4", "video_dia3.mp4", "video_dia4.mp4", "video_dia5.mp4", "video_dia6.mp4", "video_dia7.mp4",
    ]);
    expect(ordered.map((day) => day.hipnose_nome)).toEqual([
      "hipnose_dia1.mp3", "hipnose_dia2.mp3", "hipnose_dia3.mp3", "hipnose_dia4.mp3", "hipnose_dia5.mp3", "hipnose_dia6.mp3", "hipnose_dia7.mp3",
    ]);
  });
  test("vídeo do intensivo usa videos, sem alterar as jornadas por gatilho", () => {
    expect(journeyVideoBucket("ultimo_cigarro")).toBe("videos");
    expect(journeyVideoBucket("reducao")).toBe("videos_2");
    expect(getJourneyContentFlags("reducao", { video_nome: "video.mp4", hipnose_nome: "audio.mp3" }).hasVideo).toBe(false);
  });
  test("conclusão exige vídeo e hipnose, mas não missão", () => {
    expect(isJourneyContentCompleted(flags, { video: false, hipnose: true, missao: false })).toBe(false);
    expect(isJourneyContentCompleted(flags, { video: true, hipnose: false, missao: false })).toBe(false);
    expect(isJourneyContentCompleted(flags, { video: true, hipnose: true, missao: false })).toBe(true);
  });
  test("última jornada escolhida indica o próximo dia ainda não concluído", () => {
    const result = pickFocus({
      temas: { reducao: [100], abstinencia: [], ultimo_cigarro: [1, 2, 3, 4, 5, 6, 7] },
      onboardingJourney: "reducao", lastChosenJourney: toJourneyId("ultimo_cigarro"),
      isDone: (_j, day) => day === 1,
    });
    expect([result?.journey, result?.tema]).toEqual(["ultimo_cigarro", 2]);
  });
  test("progresso do intensivo não se confunde com jornadas ou antigo programa", () => {
    expect(journeyPrefix("ultimo_cigarro")).toBe("ultimo_");
    expect(journeyPrefix("ultimo_cigarro")).not.toBe(journeyPrefix("reducao"));
    expect(journeyPrefix("ultimo_cigarro")).not.toBe(journeyPrefix("abstinencia"));
  });
});