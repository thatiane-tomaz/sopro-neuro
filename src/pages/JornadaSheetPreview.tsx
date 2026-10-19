import { useState } from "react";
import { ThemeRow, ThemeSheet, SheetOptions, MissionView } from "./Jornada";
import stepVideoImg from "@/assets/step-video.png";
import stepHipnoseImg from "@/assets/step-hipnose.png";
import stepMissaoImg from "@/assets/step-missao.png";
import stepMuralImg from "@/assets/step-mural.png";

const T = [
  ["Saindo do automático", "Comece a ver o cigarro como ele é de verdade.", "ciclo_habito"],
  ["Fumar durante o trabalho", "Pare de ser interrompido pelo cigarro.", "trabalho"],
  ["Fumar em situações sociais", "Curta os eventos sem precisar fumar.", "eventos_bebida"],
  ["Fumar ao acordar", "Comece o dia livre do primeiro cigarro.", "acordar"],
];

export default function JornadaSheetPreview() {
  const [open, setOpen] = useState<number | null>(null);
  const [mission, setMission] = useState(false);
  const opts = [
    { key: "video", image: stepVideoImg, title: "Entenda", subtitle: "o que acontece no seu cérebro", done: true, onClick: () => {} },
    { key: "hipnose", image: stepHipnoseImg, title: "Transforme", subtitle: "seus hábitos com Hipnose", done: false, onClick: () => {} },
    { key: "missao", image: stepMissaoImg, title: "Experimente", subtitle: "uma nova vida mais leve", done: false, onClick: () => setMission(true) },
    { key: "mural", image: stepMuralImg, title: "Compartilhe", subtitle: "sua experiência e inspire outras pessoas", done: false, onClick: () => {} },
  ];
  return (
    <div className="min-h-screen bg-background px-3 pt-6">
      <section className="-mx-2 rounded-3xl bg-white/85 px-3 py-3">
        {T.map(([t, s, img], i) => (
          <ThemeRow key={t} isFirst={i === 0} isLast={i === T.length - 1}
            label={i === 0 ? "Já trabalhados" : i === 2 ? "Próximos temas da sua jornada" : null}
            nextHasLabel={i + 1 === 2} seq={i + 1} title={t} subtitle={s} imagemNome={img}
            isIntro status={i === 0 ? "completed" : "current"} isFocus={i === 1} onOpen={() => setOpen(i)} />
        ))}
      </section>
      {open !== null && (
        <ThemeSheet title={T[open][0]} subtitle={T[open][1]} imagemNome={T[open][2]}
          onClose={() => { setOpen(null); setMission(false); }} onBack={mission ? () => setMission(false) : undefined}>
          {mission ? <MissionView text="Observe esse hábito nos próximos dias." done={false} locked countdown="23h 59m 10s" onLater={() => {}} onChat={() => {}} /> : <SheetOptions options={opts} />}
        </ThemeSheet>
      )}
    </div>
  );
}
