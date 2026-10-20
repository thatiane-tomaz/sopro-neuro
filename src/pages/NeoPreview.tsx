import { useState } from "react";
import NeoBlock from "@/components/home/NeoBlock";
import NeoExplicaStory from "@/components/home/NeoExplicaStory";
import stepHipnose from "@/assets/step-hipnose.png";
import stepMissao from "@/assets/step-missao.png";
import stepMural from "@/assets/step-mural.png";

/** Pré-visualização do bloco do Neo e dos stories do Neo Explica. */
export default function NeoPreview() {
  const [storyOpen, setStoryOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(258_60%_97%)] to-white px-4 py-8">
      <div className="mx-auto w-full max-w-[394px]">
        <button type="button" onClick={() => setStoryOpen(true)} className="mb-4 text-sm underline">
          Abrir stories de exemplo
        </button>
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
