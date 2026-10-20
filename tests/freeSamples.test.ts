import { describe, expect, test } from "bun:test";
import { canUseFreeSample } from "../src/lib/freeSamples";

describe("amostras grátis", () => {
  test("primeira hipnose fica liberada para quem ainda não usou nenhuma", () => {
    expect(canUseFreeSample({}, "hipnose", "hipnose:onda")).toBe(true);
  });

  test("a mesma hipnose já escolhida continua aberta", () => {
    expect(canUseFreeSample({ hipnose: "hipnose:onda" }, "hipnose", "hipnose:onda")).toBe(true);
  });

  test("uma segunda hipnose diferente é bloqueada", () => {
    expect(canUseFreeSample({ hipnose: "hipnose:onda" }, "hipnose", "hipnose:cafe")).toBe(false);
  });

  test("uma segunda conversa com o Neo é bloqueada", () => {
    expect(canUseFreeSample({ neo: "livre:a" }, "neo", "missao:123")).toBe(false);
  });

  test("usar a hipnose grátis não gasta a conversa nem a explicação", () => {
    const claims = { hipnose: "hipnose:onda" };
    expect(canUseFreeSample(claims, "neo", "livre:a")).toBe(true);
    expect(canUseFreeSample(claims, "explicacao", "video:x")).toBe(true);
  });
});
