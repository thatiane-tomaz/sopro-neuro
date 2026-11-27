import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { TOUR_STEPS, TOUR_STORAGE_KEY } from "@/lib/tourSteps";

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
    if (localStorage.getItem(TOUR_STORAGE_KEY)) return;
    const t = setTimeout(() => setStep(-1), 1500);
    return () => clearTimeout(t);
  }, [user, pathname, step]);

  const current = step !== null && step >= 0 ? TOUR_STEPS[step] : null;

  const goTo = useCallback((i: number) => {
    if (i >= TOUR_STEPS.length) return finish();
    setRect(null);
    setStep(i);
  }, [finish]);

  // Rola até o alvo ao entrar no passo.
  useEffect(() => {
    if (!current || current.advance === "reveal" || pathname !== current.route) return;
    const t = setTimeout(() => {
      document.querySelector(current.targets[0])?.scrollIntoView({ behavior: "smooth", block: "center" });
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
      if (current.advance === "reveal" && r && r.top + r.height * 0.5 < window.innerHeight * 0.75) {
        goTo(step + 1);
      }
    }, 120);
    return () => clearInterval(id);
  }, [current, step, pathname, goTo]);

  if (step === null) return null;
  // Saiu do app principal (ex.: abriu um conteúdo): pausa sem perder o passo.
  if (current && pathname !== current.route && !(current.advance === "route")) return null;

  const blocking = !current || current.advance === "next";
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  let bubbleStyle: React.CSSProperties = { top: "calc(env(safe-area-inset-top) + 16px)" };
  if (current && rect && !current.bubbleTop) {
    const below = rect.top + rect.height + 12;
    bubbleStyle = below + 200 < vh ? { top: below } : { bottom: vh - rect.top + 12 };
  } else if (!current) {
    bubbleStyle = { top: "50%", transform: "translateY(-50%)" };
  }

  return createPortal(
    <div className="fixed inset-0 z-[100]" style={{ pointerEvents: blocking ? "auto" : "none" }} aria-live="polite">
      {rect && current ? (
        <div
          className="pointer-events-none absolute rounded-2xl ring-2 ring-primary transition-all duration-200"
          style={{ ...rect, boxShadow: "0 0 0 9999px hsl(var(--foreground) / 0.55)" }}
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-foreground/55" style={{ opacity: current?.advance === "reveal" ? 0 : 1 }} />
      )}

      <div
        role="dialog"
        aria-label="Tour do app"
        className="pointer-events-auto absolute inset-x-4 mx-auto max-w-sm rounded-3xl bg-card p-4 shadow-primary"
        style={bubbleStyle}
      >
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            {current && <p className="text-sm font-semibold text-primary">{current.title}</p>}
            <p className="mt-0.5 text-balance text-base font-semibold leading-snug text-foreground">
              {current ? current.text : "Bora descobrir como o Sopro te ajuda a parar de fumar?"}
            </p>
          </div>
          <button onClick={finish} aria-label="Pular tour" className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-muted-foreground tabular-nums">
            {current ? `${step + 1} de ${TOUR_STEPS.length}` : ""}
          </span>
          {!current && (
            <div className="flex gap-2">
              <Button variant="ghost" className="rounded-full" onClick={finish}>Agora não</Button>
              <Button className="rounded-full bg-gradient-method font-bold" onClick={() => { navigate("/dashboard"); goTo(0); }}>Bora!</Button>
            </div>
          )}
          {current?.advance === "next" && (
            <Button className="rounded-full bg-gradient-method font-bold" onClick={() => (current.finishLabel ? finish() : goTo(step + 1))}>
              {current.finishLabel ?? "Continuar"}
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
