import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { TOUR_INTRO, TOUR_STEPS, TOUR_STORAGE_KEY } from "@/lib/tourSteps";

type Rect = { top: number; left: number; width: number; height: number };
const PAD = 6;

function measure(selectors: string[]): Rect | null {
  const rects = selectors
    .map((s) => document.querySelector(s)?.getBoundingClientRect())
    .filter((r): r is DOMRect => !!r && r.width > 0 && r.height > 0);
  if (!rects.length) return null;
  const top = Math.min(...rects.map((r) => r.top));
  const left = Math.min(...rects.map((r) => r.left));
  const bottom = Math.max(...rects.map((r) => r.bottom));
  const right = Math.max(...rects.map((r) => r.right));
  return { top: top - PAD, left: left - PAD, width: right - left + PAD * 2, height: bottom - top + PAD * 2 };
}

/** Tour guiado do primeiro acesso: Início → Jornadas → Progresso. */
export default function GuidedTour() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // -1 = chamada inicial; null = tour inativo
  const [step, setStep] = useState<number | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);

  const finish = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, "done");
    setStep(null);
  }, []);

  // Começa só no Início, uma vez por aparelho.
  useEffect(() => {
    if (!user || step !== null || pathname !== "/dashboard") return;
    // TEMPORÁRIO: mostrar a cada atualização. Voltar para 1x depois.
    // if (localStorage.getItem(TOUR_STORAGE_KEY)) return;
    const t = setTimeout(() => setStep(-1), 1500);
    return () => clearTimeout(t);
  }, [user, pathname, step]);

  const current = step !== null && step >= 0 ? TOUR_STEPS[step] : null;

  const goTo = useCallback((i: number) => {
    if (i >= TOUR_STEPS.length) return finish();
    setRect(null);
    setStep(i);
  }, [finish]);

  // Rola o alvo para perto do topo, deixando espaço para o balão embaixo.
  useEffect(() => {
    if (!current || pathname !== current.route) return;
    const t = setTimeout(() => {
      if (!current.targets.length) return window.scrollTo({ top: 0, behavior: "smooth" });
      const el = document.querySelector(current.targets[0]);
      if (!el) return;
      const pos = getComputedStyle(el.closest("nav") ?? el).position;
      if (pos === "fixed") return;
      const top = el.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }, 250);
    return () => clearTimeout(t);
  }, [current, pathname]);

  // Acompanha a posição do alvo e avança passos de toque/rolagem.
  useLayoutEffect(() => {
    if (!current || step === null) return;
    const id = setInterval(() => {
      if (current.advance === "route" && current.nextRoute && pathname === current.nextRoute) {
        goTo(step + 1);
        return;
      }
      if (pathname !== current.route) return setRect(null);
      const r = measure(current.targets);
      setRect(r);
    }, 120);
    return () => clearInterval(id);
  }, [current, step, pathname, goTo]);

  if (step === null) return null;
  // Saiu do app principal (ex.: abriu um conteúdo): pausa sem perder o passo.
  if (current && pathname !== current.route && !(current.advance === "route")) return null;

  const blocking = !current || current.advance === "next";
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  let bubbleStyle: React.CSSProperties = { top: "50%", transform: "translateY(-50%)" };
  if (current && rect) {
    const below = rect.top + rect.height + 16;
    bubbleStyle = below + 210 < vh ? { top: below } : { bottom: Math.max(16, vh - rect.top + 16) };
  }
  const title = current ? current.title : TOUR_INTRO.title;
  const text = current ? current.text : TOUR_INTRO.text;

  return createPortal(
    <div className="fixed inset-0 z-[100]" style={{ pointerEvents: blocking ? "auto" : "none" }} aria-live="polite">
      {rect && current ? (
        <div
          className="pointer-events-none absolute rounded-3xl ring-2 ring-[hsl(var(--lilac-light))] transition-all duration-300 ease-out"
          style={{ ...rect, boxShadow: "0 0 0 9999px hsl(266 60% 12% / 0.62), 0 0 32px 4px hsl(var(--lilac) / 0.55)" }}
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-[hsl(266_60%_12%/0.62)] backdrop-blur-[2px] transition-opacity" />
      )}

      <div
        key={step}
        role="dialog"
        aria-label="Tour do app"
        className="pointer-events-auto absolute inset-x-4 mx-auto max-w-sm overflow-hidden rounded-[28px] bg-tour p-5 text-tour-foreground shadow-tour animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-300"
        style={bubbleStyle}
      >
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-[hsl(var(--lilac-light)/0.25)] blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-14 -left-8 h-32 w-32 rounded-full bg-[hsl(var(--electric-blue)/0.35)] blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--tour-foreground)/0.16)]">
              <Sparkles className="h-4 w-4" />
            </span>
            <p className="flex-1 text-sm font-semibold uppercase tracking-wide text-[hsl(var(--tour-foreground)/0.8)]">
              {current ? current.title : "Tour do Sopro"}
            </p>
            <button onClick={finish} aria-label="Pular tour" className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[hsl(var(--tour-foreground)/0.8)]">
              <X className="h-4 w-4" />
            </button>
          </div>
          {!current && <p className="mt-3 text-balance text-xl font-bold leading-snug">{title}</p>}
          <p className={current ? "mt-2 text-pretty text-base font-medium leading-relaxed" : "mt-1.5 text-pretty text-base font-medium text-[hsl(var(--tour-foreground)/0.85)]"}>
            {text}
          </p>
          <div className="mt-4 flex items-center justify-between gap-3">
            {current ? (
              <div className="flex items-center gap-1" aria-label={`Passo ${step + 1} de ${TOUR_STEPS.length}`}>
                {TOUR_STEPS.map((_, i) => (
                  <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-5 bg-[hsl(var(--tour-foreground))]" : "w-1.5 bg-[hsl(var(--tour-foreground)/0.35)]"}`} />
                ))}
              </div>
            ) : (
              <button onClick={finish} className="min-h-11 text-sm font-semibold text-[hsl(var(--tour-foreground)/0.8)]">Agora não</button>
            )}
            {!current && (
              <Button className="rounded-full bg-[hsl(var(--tour-foreground))] px-6 font-bold text-[hsl(272_70%_38%)] hover:bg-[hsl(var(--tour-foreground)/0.9)]" onClick={() => { navigate("/dashboard"); goTo(0); }}>
                Quero ver
              </Button>
            )}
            {current?.advance === "next" && (
              <Button className="rounded-full bg-[hsl(var(--tour-foreground))] px-6 font-bold text-[hsl(272_70%_38%)] hover:bg-[hsl(var(--tour-foreground)/0.9)]" onClick={() => (current.finishLabel ? finish() : goTo(step + 1))}>
                {current.finishLabel ?? "Continuar"}
              </Button>
            )}
            {current?.advance === "route" && (
              <span className="text-sm font-semibold text-[hsl(var(--tour-foreground)/0.85)]">Toque no destaque ↓</span>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
