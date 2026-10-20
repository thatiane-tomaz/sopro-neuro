/**
 * Neo Explica: stories (sequência de imagens) guardados no bucket
 * `neo-explica`, cada um numa pasta indicada na tabela `neo_explica`.
 *
 * O card da tela inicial mostra uma explicação por vez e troca:
 * - depois que a pessoa abre a explicação atual, ou
 * - quando ela está há 2 dias no card sem ser aberta.
 * A próxima é a seguinte na ordem que a pessoa ainda não abriu;
 * se já abriu todas, segue a ordem em ciclo.
 */
export const NEO_EXPLICA_ROTATION_MS = 2 * 24 * 60 * 60 * 1000;

export type NeoExplicaJornada = "reducao" | "liberdade";

export type NeoExplicaItem = {
  id: string;
  ordem: number;
  jornada: string | null;
};

export type NeoExplicaState = { explicaId: string | null; shownAt: string } | null;

export type NeoExplicaView = { explicaId: string; openedAt: string };

export type NeoExplicaPick = { explicaId: string; shownAt: string; changed: boolean };

/** Explicações da jornada da pessoa (jornada vazia vale para todas), na ordem. */
export const filterForJornada = <T extends NeoExplicaItem>(items: T[], jornada: NeoExplicaJornada): T[] =>
  items
    .filter((i) => !i.jornada || i.jornada.trim().toLowerCase() === jornada)
    .sort((a, b) => a.ordem - b.ordem);

export const pickNeoExplica = (
  items: NeoExplicaItem[],
  state: NeoExplicaState,
  views: NeoExplicaView[],
  now: number,
): NeoExplicaPick | null => {
  if (items.length === 0) return null;
  const n = items.length;
  const idx = state?.explicaId ? items.findIndex((i) => i.id === state.explicaId) : -1;

  if (idx >= 0 && state) {
    const shownAt = Date.parse(state.shownAt);
    const openedSinceShown = views.some(
      (v) => v.explicaId === state.explicaId && Date.parse(v.openedAt) >= shownAt,
    );
    if (!openedSinceShown && now - shownAt < NEO_EXPLICA_ROTATION_MS) {
      return { explicaId: state.explicaId!, shownAt: state.shownAt, changed: false };
    }
  }

  const openedEver = new Set(views.map((v) => v.explicaId));
  let next: NeoExplicaItem | undefined;
  for (let k = 1; k <= n; k++) {
    const candidate = items[(((idx + k) % n) + n) % n];
    if (!openedEver.has(candidate.id)) {
      next = candidate;
      break;
    }
  }
  if (!next) next = items[(((idx + 1) % n) + n) % n];

  return { explicaId: next.id, shownAt: new Date(now).toISOString(), changed: true };
};

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;

/** Imagens da pasta na ordem do nome (01, 02, ..., 10), ignorando outros arquivos. */
export const sortSlideNames = (names: string[]): string[] =>
  names
    .filter((n) => IMAGE_EXT.test(n))
    .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" }));
