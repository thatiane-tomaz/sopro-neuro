import { useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import neoIdeiaImg from "@/assets/neo-ideia.png";
import NeoExplicaStory from "@/components/home/NeoExplicaStory";
import { useNeoExplica, loadNeoExplicaSlides, type NeoExplica } from "@/hooks/useNeoExplica";
import { useContentAccess } from "@/hooks/useContentAccess";
import { useToast } from "@/hooks/use-toast";
import { neoExplicaSampleId } from "@/lib/freeSamples";
import { trackEvent } from "@/lib/tracking";
import type { NeoExplicaJornada } from "@/lib/neoExplica";

/** Card "Neo Explica" da tela inicial; abre os stories da explicação atual. */
export default function NeoExplicaCard({ jornada }: { jornada: NeoExplicaJornada }) {
  const { explica, markOpened, markCompleted, refresh } = useNeoExplica(jornada);
  const { ensureContentAccess } = useContentAccess();
  const { toast } = useToast();
  const [opening, setOpening] = useState(false);
  const [story, setStory] = useState<{ explica: NeoExplica; slides: string[]; viewId: string | null } | null>(null);

  if (!explica) return null;

  const open = async () => {
    if (opening) return;
    if (
      !ensureContentAccess({
        source: "neo_explica",
        sample: { kind: "explicacao", id: neoExplicaSampleId(explica.id) },
      })
    )
      return;
    setOpening(true);
    const slides = await loadNeoExplicaSlides(explica.pasta);
    setOpening(false);
    if (slides.length === 0) {
      toast({ title: "Conteúdo em preparação", description: "Esta explicação ainda será disponibilizada." });
      return;
    }
    trackEvent("content", "neo_explica_open");
    const viewId = await markOpened(explica.id);
    setStory({ explica, slides, viewId });
  };

  const close = (completed: boolean) => {
    if (completed && story?.viewId) {
      void markCompleted(story.viewId);
      trackEvent("content", "neo_explica_complete");
    }
    setStory(null);
    refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-busy={opening}
        className="mt-3 flex min-h-[90px] w-full items-center gap-2 overflow-hidden rounded-3xl bg-gradient-to-br from-[hsl(var(--electric-blue)/0.12)] to-[hsl(var(--lilac)/0.18)] py-3.5 pl-1 pr-3.5 text-left border border-[hsl(var(--lilac)/0.2)] active:scale-[0.99] transition-transform disabled:opacity-70"
      >
        <img src={neoIdeiaImg} alt="" aria-hidden width={88} height={62} draggable={false} className="-my-2 h-[76px] w-[96px] flex-shrink-0 object-contain" />
        <div className="flex min-w-0 flex-1 items-center self-stretch">
          <div className="relative flex h-[18px] w-full items-start gap-1">
            <span className="absolute bottom-full left-0 mb-1 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[hsl(var(--lilac-soft))] px-2 py-0.5 text-[10px] font-semibold text-[hsl(var(--lilac))]">
              <Sparkles className="h-3 w-3" />
              Neo Explica
            </span>
            <p className="min-w-0 flex-1 text-sm font-bold leading-[18px] text-[hsl(var(--electric-blue))]">
              {explica.titulo}
            </p>
            {opening ? (
              <span className="h-[18px] w-[18px] flex-shrink-0 animate-spin rounded-full border-2 border-[hsl(var(--lilac)/0.3)] border-t-[hsl(var(--lilac))]" />
            ) : (
              <ChevronRight className="h-[18px] w-[18px] flex-shrink-0 text-[hsl(var(--lilac))]" />
            )}
          </div>
        </div>
      </button>

      {story && (
        <NeoExplicaStory
          titulo={story.explica.titulo}
          slides={story.slides}
          segundosPorImagem={story.explica.segundos_por_imagem}
          onClose={close}
        />
      )}
    </>
  );
}
