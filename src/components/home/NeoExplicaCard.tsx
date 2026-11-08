import { useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import neoIdeiaImg from "@/assets/neo-ideia.webp";
import NeoExplicaStory from "@/components/home/NeoExplicaStory";
import { useNeoExplica, loadNeoExplicaSlides, type NeoExplica } from "@/hooks/useNeoExplica";
import { useContentAccess } from "@/hooks/useContentAccess";
import { useToast } from "@/hooks/use-toast";
import { neoExplicaSampleId } from "@/lib/freeSamples";
import { trackEvent } from "@/lib/tracking";
import type { NeoExplicaJornada } from "@/lib/neoExplica";
import { Button } from "@/components/ui/button";

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
      <Button
        variant="ghost"
        type="button"
        onClick={open}
        disabled={opening}
        aria-busy={opening}
        className="mt-3 flex h-auto min-h-[90px] w-full items-center justify-start gap-2 whitespace-normal overflow-hidden rounded-3xl border border-lilac/20 bg-gradient-to-br from-electric-blue/10 to-lilac/15 py-3.5 pl-1 pr-3.5 text-left hover:bg-lilac-soft hover:text-foreground active:scale-[0.99] disabled:opacity-70"
      >
        <img src={neoIdeiaImg} alt="" aria-hidden width={88} height={62} draggable={false} className="-my-2 h-[76px] w-[96px] flex-shrink-0 object-contain" />
        <div className="min-w-0 flex-1">
            <span className="mb-1 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-lilac-soft px-2.5 py-0.5 text-sm font-semibold text-lilac">
              <Sparkles className="h-3.5 w-3.5" />
              Neo Explica
            </span>
          <div className="flex items-center gap-1">
            <p className="min-w-0 flex-1 text-balance text-base font-semibold leading-snug text-electric-blue">
              {explica.titulo}
            </p>
            {opening ? (
              <span className="h-[18px] w-[18px] flex-shrink-0 animate-spin rounded-full border-2 border-[hsl(var(--lilac)/0.3)] border-t-[hsl(var(--lilac))]" />
            ) : (
              <ChevronRight className="h-[18px] w-[18px] flex-shrink-0 text-[hsl(var(--lilac))]" />
            )}
          </div>
        </div>
      </Button>

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
