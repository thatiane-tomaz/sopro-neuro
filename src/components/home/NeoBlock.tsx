import { useState } from "react";
import { Send } from "lucide-react";
import ProgressBrain from "@/components/home/ProgressBrain";

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
          {/* Neo à esquerda · perguntas sugeridas à direita */}
          <div className="relative flex items-start gap-1.5">
            <div className="flex-shrink-0">
              <ProgressBrain
                compact
                locked={locked}
                onClick={() => onOpenChat()}
                ariaLabel="Conversar com Neo"
              />
            </div>

            {sugestoes.length > 0 && (
              <div className="flex min-w-0 flex-1 flex-col items-stretch gap-2 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[hsl(258_35%_58%)]">
                  PERGUNTE AO NEO
                </span>
                {sugestoes.map((p, i) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => (needsReview ? onOpenReview() : onOpenChat(p))}
                    style={{ animationDelay: `${120 + i * 90}ms` }}
                    className="animate-page-in rounded-[20px] rounded-bl-md bg-gradient-to-br from-[hsl(220_90%_96%)] to-[hsl(258_75%_95%)] px-3.5 py-2 text-left text-[11.5px] font-semibold leading-snug text-[hsl(258_45%_32%)] ring-1 ring-[hsl(258_60%_90%)] shadow-[0_8px_20px_-14px_hsl(258_70%_45%/0.35)] active:scale-[0.97] transition-transform"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Composer: escreva direto no Dashboard e o chat abre em modal */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const text = draft.trim();
              if (!text) return;
              setDraft("");
              onOpenChat(text);
            }}
            className="relative mt-3 flex items-center gap-2"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Fala comigo..."
              aria-label="Escrever para o Neo"
              className="flex-1 min-w-0 rounded-full bg-white px-4 py-3 text-base md:text-sm shadow-[0_8px_22px_-12px_hsl(258_70%_45%/0.25)] ring-1 ring-[hsl(258_70%_92%)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_70%_70%)] placeholder:text-muted-foreground/70"
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
        </>
      )}
    </section>
  );
}
