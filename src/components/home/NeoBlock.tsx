import { useState } from "react";
import { Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProgressBrain from "@/components/home/ProgressBrain";
import neoCloud from "@/assets/neo-cloud-bg.webp";

// Cada opção abre o chat já com uma mensagem que direciona o Neo:
// "bem" → reforçar e entender o que está ajudando na rotina;
// "vontade"/"difícil" → entender o que está acontecendo e o que fazer para melhorar.
const MOODS = [
  {
    emoji: "😌",
    label: "Estou bem",
    seed: "Hoje estou bem com a minha vontade de fumar. Me ajuda a entender o que na minha rotina está me fazendo bem, para eu continuar assim?",
    cls: "bg-electric-blue/5 ring-electric-blue/15 text-mood-calm",
  },
  {
    emoji: "😐",
    label: "Senti vontade",
    seed: "Hoje senti vontade de fumar. Me ajuda a entender o que está acontecendo e o que posso fazer para melhorar?",
    cls: "bg-lilac-soft ring-lilac/20 text-mood-calm",
  },
  {
    emoji: "😣",
    label: "Está difícil",
    seed: "Hoje está difícil, a vontade de fumar está forte. Me ajuda a entender o que está acontecendo e o que posso fazer agora para melhorar?",
    cls: "bg-mood-challenging-soft ring-mood-challenging/15 text-mood-challenging",
  },
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
    <section className="app-surface mt-5 relative overflow-hidden p-3.5">

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
          {/* Nuvem lilás de fundo atrás do Neo (encosta na borda direita do card) */}
          <img
            src={neoCloud}
            alt=""
            aria-hidden
            width={640}
            height={357}
            draggable={false}
            className="pointer-events-none absolute -right-12 top-1 w-[250px] max-w-none select-none opacity-90"
          />

          {/* Cabeçalho: título/descrição à esquerda · Neo à direita */}
          <div className="relative flex items-start">
            <div className="relative z-10 min-w-0 flex-1 pr-1">
              <h2 className="text-balance text-lg font-bold leading-tight text-electric-blue">
                Converse com o Neo
              </h2>
              <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground font-medium">
                Entenda seus gatilhos, descubra novas formas de lidar com o cigarro.
              </p>
            </div>
            <div className="relative -mr-3 -mt-5 -mb-4 w-[112px] flex-shrink-0">
              {/* Balão de fala com reticências */}
              <svg
                aria-hidden
                viewBox="0 0 56 42"
                className="absolute -left-3 top-5 z-10 h-[38px] w-[50px] "
              >
                <path
                  d="M15 1h26a14 14 0 0 1 0 28h-3l6 10-13-10H15A14 14 0 0 1 15 1z"
                  fill="hsl(var(--lilac-soft))"
                  stroke="hsl(var(--surface-raised))"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <circle cx="19" cy="15" r="2.6" fill="hsl(var(--electric-blue))" />
                <circle cx="28" cy="15" r="2.6" fill="hsl(var(--electric-blue))" />
                <circle cx="37" cy="15" r="2.6" fill="hsl(var(--electric-blue))" />
              </svg>
              <div className="relative -scale-x-100 [&>div]:w-full [&>div>div]:!h-32 [&>div>div]:!w-full [&_button]:!h-24 [&_button]:!w-24">
                <ProgressBrain
                  compact
                  locked={locked}
                  onClick={() => onOpenChat()}
                  ariaLabel="Conversar com Neo"
                />
              </div>
            </div>
          </div>

          <div className="relative mt-1 border-t border-border/60 pb-0 pt-3.5">
            <p className="text-sm font-semibold text-foreground">
              Como está sua vontade de fumar hoje?
            </p>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {MOODS.map((m) => (
                <Button variant="ghost"
                  key={m.label}
                  type="button"
                  onClick={() => (needsReview ? onOpenReview() : onOpenChat(m.seed))}
                  className={`flex h-auto min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl px-0.5 py-2.5 text-sm font-medium whitespace-normal text-center leading-snug ring-1 hover:bg-muted/50 hover:text-foreground active:scale-[0.97] ${m.cls}`}
                >
                  <span className="text-2xl leading-none" aria-hidden>{m.emoji}</span>
                  {m.label}
                </Button>
              ))}
            </div>

            {sugestoes.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {sugestoes.slice(0, 2).map((p) => (
                  <Button variant="ghost"
                    key={p}
                    type="button"
                    onClick={() => (needsReview ? onOpenReview() : onOpenChat(p))}
                    className="inline-flex h-auto min-h-11 items-center justify-start gap-1.5 whitespace-normal rounded-2xl bg-surface-subtle px-3 py-2 text-left text-sm font-medium leading-snug text-muted-foreground ring-1 ring-border/60 hover:bg-muted/50 hover:text-foreground active:scale-[0.97]"
                  >
                    <MessageCircle className="h-3.5 w-3.5 flex-shrink-0 text-lilac" />
                    {p}
                  </Button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const text = draft.trim();
                if (!text) return;
                setDraft("");
                onOpenChat(text);
              }}
              className="mt-2.5 flex items-center gap-2"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Fala comigo, o que está passando na sua cabeça?"
                aria-label="Escrever para o Neo"
                className="flex-1 min-w-0 rounded-full bg-surface-raised px-4 py-3 text-base md:text-sm ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-electric-blue/50 placeholder:text-muted-foreground"
              />
              <Button variant="ghost"
                type="submit"
                disabled={!draft.trim()}
                aria-label="Enviar para o Neo"
                className="h-11 w-11 p-0 flex-shrink-0 rounded-full bg-gradient-method text-primary-foreground flex items-center justify-center shadow-wellness disabled:opacity-40 active:scale-95 transition-transform"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </>
      )}
    </section>
  );
}
