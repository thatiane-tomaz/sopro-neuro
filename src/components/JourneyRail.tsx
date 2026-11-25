import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function JourneyRail({ children, label }: { children: ReactNode; label: string }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [canAdvance, setCanAdvance] = useState(false);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const update = () => setCanAdvance(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 2);
    update();
    rail.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(rail);
    return () => {
      rail.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [children]);

  const advance = () => {
    const rail = railRef.current;
    if (!rail) return;
    const padding = parseFloat(getComputedStyle(rail).paddingLeft) || 0;
    const next = Array.from(rail.children).find(
      (card) => (card as HTMLElement).offsetLeft - padding > rail.scrollLeft + 2,
    );
    if (!next) return;
    rail.scrollTo({
      left: (next as HTMLElement).offsetLeft - padding,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  };

  return (
    <div className="relative -mx-5 mt-3">
      <div ref={railRef} className="relative flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-4 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
      {canAdvance && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Próximo tema: ${label}`}
          title="Próximo tema"
          onClick={advance}
          className="absolute right-5 top-1/2 z-10 h-11 w-11 -translate-y-1/2 touch-manipulation rounded-full bg-card/75 text-primary shadow-surface backdrop-blur-sm hover:bg-card/95"
        >
          <ChevronRight className="opacity-70" strokeWidth={2.5} />
        </Button>
      )}
    </div>
  );
}