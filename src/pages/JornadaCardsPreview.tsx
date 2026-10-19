import { ThemeRow } from "./Jornada";
const rows = [
  { t: "Saindo do automático", s: "Perceba quando o cigarro entra sem você notar.", img: "ciclo_habito", st: "completed" },
  { t: "Fumar quando está ansioso", s: "Aprenda a acalmar a ansiedade sem fumar.", img: "ansiedade_estresse", st: "current" },
  { t: "Fumar rouba sua energia", s: "Recupere a disposição que o cigarro tira de você.", img: "energia_movimentar", st: "locked" },
  { t: "Fumar tomando café", s: "Aproveite seu café sem o cigarro.", img: null, st: "locked" },
] as const;
export default function P() {
  return (
    <div className="mx-auto max-w-md px-5 py-6 bg-[hsl(225_60%_95%)] min-h-screen">
      <section className="-mx-2 rounded-3xl bg-white/85 px-3 py-3">
        {rows.map((r, i) => (
          <ThemeRow key={i} isFirst={i === 0} isLast={i === rows.length - 1}
            label={i === 0 ? "Já trabalhados" : i === 2 ? "Próximos temas da sua jornada" : null}
            nextHasLabel={i + 1 === 2} seq={i + 1} title={r.t} subtitle={r.s} imagemNome={r.img}
            isIntro={i < 2} status={r.st as any} isFocus={i === 1}
            activities={i === 1 ? { done: 1, total: 3 } : null}
            hasVideo hasHipnose onVideo={() => {}} onHypnosis={() => {}} onMural={() => {}} />
        ))}
      </section>
    </div>
  );
}
