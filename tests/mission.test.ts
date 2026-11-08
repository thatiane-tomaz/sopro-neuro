import { expect, test } from "bun:test";
import { getMissionCopy, shouldOpenMissionAfterHypnosis } from "../src/lib/mission";

test("abre missão apenas ao terminar a hipnose, não ao atingir 85%", () => {
  expect(shouldOpenMissionAfterHypnosis("hypnosis", false, true)).toBe(false);
  expect(shouldOpenMissionAfterHypnosis("hypnosis", true, true)).toBe(true);
});
test("vídeos e temas sem missão não abrem missão", () => {
  expect(shouldOpenMissionAfterHypnosis("video", true, true)).toBe(false);
  expect(shouldOpenMissionAfterHypnosis("hypnosis", true, false)).toBe(false);
});
test("mantém instrução principal e secundária juntas no contexto do Neo", () => {
  expect(getMissionCopy({ missao_principal: "Respire", missao_secundaria: "Conte ao Neo" }).full).toBe("Respire\n\nConte ao Neo");
});
test("missão antiga continua disponível se ainda não tiver textos separados", () => {
  expect(getMissionCopy({ explicacao_missao: "Observe sua vontade" }).primary).toBe("Observe sua vontade");
});