import { describe, expect, test } from "bun:test";
import {
  NEO_EXPLICA_ROTATION_MS,
  filterForJornada,
  pickNeoExplica,
  sortSlideNames,
} from "../src/lib/neoExplica";

const items = [
  { id: "a", ordem: 1, jornada: null },
  { id: "b", ordem: 2, jornada: null },
  { id: "c", ordem: 3, jornada: null },
];
const t0 = Date.parse("2026-10-20T12:00:00Z");
const iso = (ms: number) => new Date(ms).toISOString();
const DAY = 24 * 60 * 60 * 1000;

describe("Neo Explica: troca do card", () => {
  test("a troca acontece a cada 2 dias", () => {
    expect(NEO_EXPLICA_ROTATION_MS).toBe(2 * DAY);
  });

  test("primeira vez mostra a primeira da ordem", () => {
    expect(pickNeoExplica(items, null, [], t0)?.explicaId).toBe("a");
  });

  test("continua a mesma antes de 2 dias se não foi aberta", () => {
    const pick = pickNeoExplica(items, { explicaId: "a", shownAt: iso(t0) }, [], t0 + 1.9 * DAY);
    expect(pick?.explicaId).toBe("a");
    expect(pick?.changed).toBe(false);
  });

  test("troca depois de 2 dias mesmo sem abrir", () => {
    const pick = pickNeoExplica(items, { explicaId: "a", shownAt: iso(t0) }, [], t0 + 2 * DAY);
    expect(pick?.explicaId).toBe("b");
  });

  test("troca logo depois que a pessoa abre", () => {
    const pick = pickNeoExplica(
      items,
      { explicaId: "a", shownAt: iso(t0) },
      [{ explicaId: "a", openedAt: iso(t0 + 60_000) }],
      t0 + 120_000,
    );
    expect(pick?.explicaId).toBe("b");
  });

  test("pula as que a pessoa já abriu", () => {
    const pick = pickNeoExplica(
      items,
      { explicaId: "a", shownAt: iso(t0) },
      [{ explicaId: "b", openedAt: iso(t0 - DAY) }],
      t0 + 2 * DAY,
    );
    expect(pick?.explicaId).toBe("c");
  });

  test("quando já abriu todas, segue a ordem em ciclo", () => {
    const views = items.map((i) => ({ explicaId: i.id, openedAt: iso(t0 - DAY) }));
    const pick = pickNeoExplica(items, { explicaId: "c", shownAt: iso(t0) }, views, t0 + 2 * DAY);
    expect(pick?.explicaId).toBe("a");
  });

  test("sem explicações cadastradas não mostra o card", () => {
    expect(pickNeoExplica([], null, [], t0)).toBeNull();
  });
});

describe("Neo Explica: jornada e imagens", () => {
  test("mostra as da jornada da pessoa e as sem jornada", () => {
    const list = filterForJornada(
      [
        { id: "r", ordem: 2, jornada: "reducao" },
        { id: "l", ordem: 1, jornada: "liberdade" },
        { id: "t", ordem: 3, jornada: null },
      ],
      "reducao",
    );
    expect(list.map((i) => i.id)).toEqual(["r", "t"]);
  });

  test("imagens seguem a ordem do número no nome", () => {
    expect(sortSlideNames(["10.png", "2.png", "1.png", ".emptyFolderPlaceholder"])).toEqual([
      "1.png",
      "2.png",
      "10.png",
    ]);
  });
});
