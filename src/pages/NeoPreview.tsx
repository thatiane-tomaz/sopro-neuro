import NeoBlock from "@/components/home/NeoBlock";

/** Pré-visualização do bloco do Neo (Neo à esquerda, perguntas à direita). */
export default function NeoPreview() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(258_60%_97%)] to-white px-4 py-8">
      <div className="mx-auto w-full max-w-[394px]">
        <NeoBlock
          locked={false}
          gancho="Vamos entender o que disparou a vontade hoje?"
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
    </div>
  );
}
