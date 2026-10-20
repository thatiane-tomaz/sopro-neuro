import { useState } from "react";
import { ClipboardList, Headphones, MessageCircleHeart } from "lucide-react";
import NeoBlock from "@/components/home/NeoBlock";
import NeoExplicaStory from "@/components/home/NeoExplicaStory";
import FocoAtualCard from "@/components/home/FocoAtualCard";
import stepHipnose from "@/assets/step-hipnose.png";
import stepMissao from "@/assets/step-missao.png";
import stepMural from "@/assets/step-mural.png";
import neoIdeia from "@/assets/neo-ideia.png";

/** Pré-visualização do foco atual, do bloco do Neo e dos stories do Neo Explica. */
export default function NeoPreview() {
  const [storyOpen, setStoryOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(258_60%_97%)] to-white px-3 py-8">
      <div className="mx-auto w-full max-w-[394px]">
        <button type="button" onClick={() => setStoryOpen(true)} className="mb-4 text-sm underline">
          Abrir stories de exemplo
        </button>
        <FocoAtualCard
          tituloGatilho="A vontade é como uma onda"
          subtituloGatilho="Aprenda a atravessar a vontade sem precisar fumar."
          imagemGatilho={neoIdeia}
          focoAtualNumero={2}
          totalFocos={7}
          steps={[
            { key: "hipnose", label: "Hipnose", verb: "Transforme", rest: "seus hábitos", image: stepHipnose, icon: Headphones, done: true, onClick: () => {}, actionLabel: "Continuar com a hipnose" },
            { key: "missao", label: "Missão", verb: "Experimente", rest: "uma vida mais leve", image: stepMissao, icon: ClipboardList, done: false, onClick: () => {}, actionLabel: "Continuar com a missão" },
            { key: "mural", label: "Mural", verb: "Compartilhe", rest: "sua jornada", image: stepMural, icon: MessageCircleHeart, done: false, onClick: () => {}, actionLabel: "Compartilhe no mural" },
          ]}
        />
        <NeoBlock
          locked={false}
          sugestoes={[
            "Estou com vontade de fumar agora",
            "Me ajuda a relaxar sem cigarro",
            "Por que sinto falta de fumar?",
          ]}
          needsReview={false}
          onOpenChat={() => {}}
          onOpenReview={() => {}}
        />
      </div>
      {storyOpen && (
        <NeoExplicaStory
          titulo="Por que o cigarro te deixa mais ansioso?"
          slides={[stepHipnose, stepMissao, stepMural]}
          segundosPorImagem={7}
          onClose={() => setStoryOpen(false)}
        />
      )}
    </div>
  );
}
