import { useState } from "react";
import { Send, MessageCircle } from "lucide-react";
import ProgressBrain from "@/components/home/ProgressBrain";

const MOODS = [
  { emoji: "😌", label: "Estou bem", seed: "Estou bem hoje.", cls: "bg-[hsl(150_60%_95%)] ring-[hsl(150_45%_85%)] text-[hsl(150_35%_25%)]" },
  { emoji: "😐", label: "Senti vontade", seed: "Senti vontade de fumar hoje.", cls: "bg-[hsl(42_95%_94%)] ring-[hsl(42_80%_82%)] text-[hsl(32_50%_28%)]" },
  { emoji: "😣", label: "Está difícil", seed: "Hoje está difícil.", cls: "bg-[hsl(0_85%_96%)] ring-[hsl(0_70%_88%)] text-[hsl(0_45%_35%)]" },
];

interface Props {
  locked: boolean;
  sugestoes: string[];
  needsReview: boolean;
  onOpenChat: (seed?: string) => void;
  onOpenReview: () => void;
}

/**
 * Bloco da IA no Dashboard: Neo à esquerda, perguntas sugeridas à direita,
 * composer em largura total abaixo.
 */
export default function NeoBlock({
  locked,
  sugestoes,
  needsReview,
  onOpenChat,
  onOpenReview,
}: Props) {
  const [draft, setDraft] = useState("");

  return (
    <section className="mt-7 relative overflow-hidden rounded-[28px] bg-gradient-to-b from-white/80 via-white/60 to-[hsl(258_80%_97%)]/70 px-3 pt-2 pb-3 ring-1 ring-white/70 backdrop-blur-xl shadow-[0_24px_60px_-32px_hsl(258_70%_45%/0.35)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-[hsl(258_80%_75%/0.25)] blur-3xl"
      />

      {locked ? (
        <div className="relative">
          <ProgressBrain
            locked={locked}
            onClick={() => onOpenChat()}
            ariaLabel="Conversar com Neo"
          />
        </div>
      ) : (
        <>
          {/* Cabeçalho: título/descrição à esquerda · Neo à direita */}
          <div className="relative flex items-center gap-1 pl-2">
            <div className="min-w-0 flex-1 pt-2">
              <h2 className="text-balance text-lg font-bold leading-tight text-[hsl(258_45%_22%)]">
                Converse com o Neo
              </h2>
              <p className="mt-1 text-balance text-[12px] leading-snug text-muted-foreground">
                Seu assistente para entender seus gatilhos, tirar dúvidas e encontrar novas formas de lidar com o cigarro.
              </p>
            </div>
            <div className="-mr-2 flex-shrink-0">
              <ProgressBrain
                compact
                locked={locked}
                onClick={() => onOpenChat()}
                ariaLabel="Conversar com Neo"
              />
            </div>
          </div>

          <div className="relative -mt-2 rounded-3xl bg-white/80 px-3 pb-3 pt-3.5 ring-1 ring-white shadow-[0_10px_30px_-20px_hsl(258_70%_45%/0.35)]">
            <p className="text-sm font-bold text-[hsl(258_45%_22%)]">
              Como você está se sentindo hoje?
            </p>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => (needsReview ? onOpenReview() : onOpenChat(m.seed))}
                  className={`flex flex-col items-center gap-1 rounded-2xl px-1 py-2.5 text-[11.5px] font-semibold ring-1 active:scale-[0.97] transition-transform ${m.cls}`}
                >
                  <span className="text-2xl leading-none" aria-hidden>{m.emoji}</span>
                  {m.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const text = draft.trim();
                if (!text) return;
                setDraft("");
                onOpenChat(text);
              }}
              className="mt-3 flex items-center gap-2"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Fala comigo, o que está passando na sua cabeça?"
                aria-label="Escrever para o Neo"
                className="flex-1 min-w-0 rounded-full bg-white px-4 py-3 text-base md:text-sm ring-1 ring-[hsl(258_70%_90%)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_70%_70%)] placeholder:text-muted-foreground/70"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                aria-label="Enviar para o Neo"
                className="h-11 w-11 flex-shrink-0 rounded-full bg-gradient-to-br from-[hsl(220_90%_55%)] to-[hsl(258_70%_55%)] text-primary-foreground flex items-center justify-center shadow-[0_10px_24px_-10px_hsl(258_70%_45%/0.55)] disabled:opacity-40 active:scale-95 transition-transform"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>

            {sugestoes.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-2">
                {sugestoes.slice(0, 2).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => (needsReview ? onOpenReview() : onOpenChat(p))}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-left text-[11px] font-medium leading-snug text-[hsl(258_45%_32%)] ring-1 ring-[hsl(258_60%_90%)] active:scale-[0.97] transition-transform"
                  >
                    <MessageCircle className="h-3.5 w-3.5 flex-shrink-0 text-[hsl(258_70%_55%)]" />
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
