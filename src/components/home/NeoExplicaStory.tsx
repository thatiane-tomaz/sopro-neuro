import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Sparkles } from "lucide-react";
import { useScrollLock } from "@/hooks/useScrollLock";

interface Props {
  titulo: string;
  slides: string[];
  segundosPorImagem: number;
  /** completed = chegou ao fim da última imagem */
  onClose: (completed: boolean) => void;
}

/**
 * Visualizador em tela cheia no formato de stories:
 * barrinhas de progresso no topo, toque à direita avança, à esquerda volta,
 * segurar o dedo pausa. Passa sozinho depois de alguns segundos.
 */
export default function NeoExplicaStory({ titulo, slides, segundosPorImagem, onClose }: Props) {
  useScrollLock(true);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const pressStart = useRef<number | null>(null);
  const durationMs = Math.max(2, segundosPorImagem || 7) * 1000;

  const goTo = (next: number) => {
    if (next < 0) {
      setProgress(0);
      return;
    }
    if (next >= slides.length) {
      onClose(true);
      return;
    }
    setLoaded(false);
    setProgress(0);
    setIndex(next);
  };

  // Pré-carrega a próxima imagem
  useEffect(() => {
    const nextSrc = slides[index + 1];
    if (nextSrc) {
      const img = new Image();
      img.src = nextSrc;
    }
  }, [index, slides]);

  // Avanço automático
  useEffect(() => {
    if (paused || !loaded) return;
    let raf = 0;
    let last = performance.now();
    const step = (t: number) => {
      const dt = t - last;
      last = t;
      setProgress((p) => Math.min(1, p + dt / durationMs));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [paused, loaded, durationMs, index]);

  useEffect(() => {
    if (progress >= 1) goTo(index + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(false);
      if (e.key === "ArrowRight") goTo(index + 1);
      if (e.key === "ArrowLeft") goTo(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const handlePointerDown = () => {
    pressStart.current = Date.now();
    setPaused(true);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const held = pressStart.current ? Date.now() - pressStart.current : 0;
    pressStart.current = null;
    setPaused(false);
    if (held > 250) return; // segurou para pausar, não navega
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    goTo(x < rect.width * 0.3 ? index - 1 : index + 1);
  };

  // Portal no body: um ancestral com transform/animação faria o "fixed"
  // se prender ao card em vez da tela inteira.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground animate-in fade-in duration-200"
    >
      <div className="relative h-full w-full max-w-md">
        <img
          key={slides[index]}
          src={slides[index]}
          alt={`${titulo} — parte ${index + 1} de ${slides.length}`}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          draggable={false}
          className="h-full w-full select-none object-contain"
        />

        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-background/30 border-t-background" />
          </div>
        )}

        {/* Área de toque: esquerda volta, direita avança, segurar pausa */}
        <div
          className="absolute inset-0 touch-none select-none"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            pressStart.current = null;
            setPaused(false);
          }}
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Topo: progresso, etiqueta e fechar */}
        <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-foreground/60 to-transparent px-3 pb-8 pt-[max(env(safe-area-inset-top),12px)]">
          <div className="flex gap-1">
            {slides.map((_, i) => (
              <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-background/30">
                <div
                  className="h-full rounded-full bg-background"
                  style={{ width: `${i < index ? 100 : i === index ? progress * 100 : 0}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-background/20 px-2 py-0.5 text-sm font-semibold text-background backdrop-blur">
              <Sparkles className="h-3 w-3" />
              Neo Explica
            </span>
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-background">{titulo}</p>
            <button
              type="button"
              onClick={() => onClose(false)}
              aria-label="Fechar"
              className="pointer-events-auto -mr-1 flex h-11 w-11 items-center justify-center rounded-full text-background active:scale-95"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
