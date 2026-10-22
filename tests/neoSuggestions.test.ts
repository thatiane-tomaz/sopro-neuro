import { describe, expect, test } from "bun:test";
import { buildNeoSuggestions, METODO_QUESTION } from "../src/lib/neoSuggestions";

const DAY = 24 * 60 * 60 * 1000;
const created = "2026-10-01T12:00:00Z";
const t0 = new Date(created).getTime();
const sorteadas = ["Estou com vontade de fumar agora", "Me ajuda a relaxar sem cigarro"];

describe("pergunta fixa do método nas sugestões do Neo", () => {
  test("no primeiro dia, a primeira sugestão é 'Como funciona o método Sopro?'", () => {
    expect(buildNeoSuggestions(sorteadas, created, t0 + DAY / 2)[0]).toBe("Como funciona o método Sopro?");
  });

  test("no 13º dia ainda aparece em primeiro", () => {
    expect(buildNeoSuggestions(sorteadas, created, t0 + 13 * DAY)[0]).toBe(METODO_QUESTION);
  });

  test("depois de 2 semanas (14 dias) deixa de aparecer", () => {
    expect(buildNeoSuggestions(sorteadas, created, t0 + 14 * DAY)).toEqual(sorteadas);
  });

  test("sem data de criação da conta, não aparece", () => {
    expect(buildNeoSuggestions(sorteadas, null, t0)).toEqual(sorteadas);
  });
});
