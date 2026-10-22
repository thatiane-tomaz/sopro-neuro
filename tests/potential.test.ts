import { describe, expect, test } from "bun:test";
import { computePotential } from "../src/lib/potential";

describe("potencial mês/ano", () => {
  test("mês considera ~4,35 semanas (R$ 100/semana = R$ 435/mês)", () => {
    expect(computePotential(0, 100).moneyMonth).toBe(435);
  });

  test("economia do ano é sempre 12x a do mês", () => {
    const p = computePotential(0, 100);
    expect(p.moneyYear).toBe(5220);
  });

  test("cigarros do mês usam 30,4 dias (20/dia = 608/mês)", () => {
    expect(computePotential(20, 0).cigsMonth).toBe(608);
  });

  test("cigarros do ano são sempre 12x os do mês", () => {
    expect(computePotential(20, 0).cigsYear).toBe(7296);
  });
});
