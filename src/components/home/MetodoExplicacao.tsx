import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useScrollLock } from "@/hooks/useScrollLock";
import metodoReducao from "@/assets/metodo-reducao.webp";
import metodoLiberdade from "@/assets/metodo-liberdade.webp";

export type MetodoJornada = "reducao" | "liberdade";

/** Imagem com a explicação do método para cada jornada. */
const METODO_IMAGENS: Partial<Record<MetodoJornada, string>> = {
  reducao: metodoReducao,
  liberdade: metodoLiberdade,
};

export const metodoImagem = (jornada: MetodoJornada): string | null => METODO_IMAGENS[jornada] ?? null;

interface Props {
  jornada: MetodoJornada;
  onClose: () => void;
}

/** Tela cheia com a explicação do Método Sopro Neuro da jornada da pessoa. */
export default function MetodoExplicacao({ jornada, onClose }: Props) {
  useScrollLock(true);
  const src = metodoImagem(jornada);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!src) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Como funciona o Método Sopro Neuro"
      className="fixed inset-0 z-[100] flex justify-center bg-foreground/90 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div className="relative h-full w-full max-w-md overflow-y-auto overscroll-contain">
        <div className="flex min-h-full items-center">
          <img
            src={src}
            alt="Método Sopro Neuro: como funciona a sua jornada"
            draggable={false}
            onClick={(e) => e.stopPropagation()}
            className="block w-full select-none"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="fixed right-3 top-[max(env(safe-area-inset-top),12px)] flex h-11 w-11 items-center justify-center rounded-full bg-foreground/40 text-background backdrop-blur active:scale-95"
      >
        <X className="h-6 w-6" />
      </button>
    </div>,
    document.body,
  );
}
