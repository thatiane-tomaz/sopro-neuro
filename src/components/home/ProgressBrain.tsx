import { Lock, Sparkles } from "lucide-react";
import type { BrainLevel, BrainState } from "@/hooks/useBrainSparks";
import lv1Active from "@/assets/brain/brain-lv1-active.png";
import lv1Resting from "@/assets/brain/brain-lv1-resting.png";
import lv2Active from "@/assets/brain/brain-lv2-active.png";
import lv2Resting from "@/assets/brain/brain-lv2-resting.png";
import lv3Active from "@/assets/brain/brain-lv3-active.png";
import lv3Resting from "@/assets/brain/brain-lv3-resting.png";
import lv4Active from "@/assets/brain/brain-lv4-active.png";
import lv4Resting from "@/assets/brain/brain-lv4-resting.png";
import lv5Active from "@/assets/brain/brain-lv5-active.png";
import lv5Resting from "@/assets/brain/brain-lv5-resting.png";

const BRAIN_ASSETS: Record<BrainLevel, Record<BrainState, string>> = {
  1: { active: lv1Active, resting: lv1Resting },
  2: { active: lv2Active, resting: lv2Resting },
  3: { active: lv3Active, resting: lv3Resting },
  4: { active: lv4Active, resting: lv4Resting },
  5: { active: lv5Active, resting: lv5Resting },
};

interface Props {
  locked: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  level?: BrainLevel;
  state?: BrainState;
  sparks?: number;
  /** 0-100 progress within the current level (arc fill). Level 5 = 100. */
  levelProgress?: number;
}

/**
 * Open-bottom 3/4 circular progress arc with the 3D brain centered.
 * The arc represents the user's progress within the current brain level.
 */
export default function ProgressBrain({
  locked,
  onClick,
  ariaLabel,
  level = 1,
  state = "resting",
  sparks = 0,
  levelProgress = 0,
}: Props) {
  const clamped = Math.max(0, Math.min(100, levelProgress));
  const brainImg = BRAIN_ASSETS[level][state];
  const isResting = state === "resting";
  const isMax = level === 5;

  const size = 300;
  const brainSize = 198;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 130;

  // Open-bottom arc: gap of ~70° at the bottom.
  // Start angle = 125° (bottom-left), sweep clockwise to 55° (bottom-right) → 290° total.
  const startAngle = 125;
  const sweep = 290;
  const toXY = (angleDeg: number) => {
    const a = (angleDeg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
  };
  const start = toXY(startAngle);
  const end = toXY(startAngle + sweep);
  const largeArc = sweep > 180 ? 1 : 0;
  const arcPath = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;

  const arcLen = (sweep / 360) * 2 * Math.PI * radius;
  const dash = (clamped / 100) * arcLen;

  const interactive = typeof onClick === "function";

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
        <defs>
          <linearGradient id="arcGrad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(195 95% 60%)" />
            <stop offset="25%" stopColor="hsl(215 95% 60%)" />
            <stop offset="55%" stopColor="hsl(245 90% 62%)" />
            <stop offset="80%" stopColor="hsl(275 85% 65%)" />
            <stop offset="100%" stopColor="hsl(300 80% 70%)" />
          </linearGradient>
          <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Track */}
        <path
          d={arcPath}
          fill="none"
          stroke="hsl(220 40% 92%)"
          strokeWidth={10}
          strokeLinecap="round"
        />
        {/* Filled */}
        <path
          d={arcPath}
          fill="none"
          stroke="url(#arcGrad)"
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${arcLen}`}
          filter="url(#arcGlow)"
          style={{ transition: "stroke-dasharray 1.2s ease-out" }}
        />
      </svg>

      {/* Soft glow behind brain */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ width: 270, height: 270, background: "var(--gradient-brain-glow)" }}
        aria-hidden="true"
      />

      {/* Brain centered, sized to fill the arc */}
      <div className="absolute inset-0 flex items-center justify-center overflow-visible" style={{ transform: "translateY(-12px)" }}>
        {interactive ? (
          <button
            type="button"
            onClick={onClick}
            aria-label={ariaLabel ?? "Abrir jornada"}
            className="relative rounded-full overflow-visible focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-transform active:scale-95 hover:scale-[1.02]"
            style={{ width: brainSize, height: brainSize }}
          >
            <img
              src={brainImg}
              alt={`Cérebro nível ${level} ${state === "active" ? "ativo" : "descansando"}`}
              width={brainSize}
              height={brainSize}
              loading="eager"
              draggable={false}
              className={`w-full h-full object-contain pointer-events-none ${
                isResting ? "animate-breathe opacity-90" : "animate-pulse-glow"
              } ${locked ? "grayscale opacity-60" : ""}`}
            />
            {!locked && (
              <span className="pointer-events-none absolute inset-0 flex items-end justify-center pb-6 select-none">
                <span className="text-[10px] font-semibold text-white/95 text-center px-4 tracking-wide"
                  style={{ textShadow: "0 1px 4px hsl(230 60% 25% / 0.55)" }}>
                  Toque para conversar
                </span>
              </span>
            )}
          </button>
        ) : (
          <img
          src={brainImg}
          alt={`Cérebro nível ${level}`}
          width={brainSize}
          height={brainSize}
          loading="eager"
          className={`object-contain ${
            isResting ? "animate-breathe opacity-90" : "animate-pulse-glow"
          } ${locked ? "grayscale opacity-60" : ""}`}
          style={{ width: brainSize, height: brainSize }}
          />
        )}
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Sparks + Level chip anchored to the bottom arc gap */}
      {!locked && (
        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2" style={{ bottom: 4 }}>
          <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-white/95 backdrop-blur px-3 py-1.5 ring-1 ring-[hsl(220_70%_88%)] shadow-[0_8px_20px_-8px_hsl(258_70%_45%/0.5)]">
            <span className="inline-flex items-center gap-1 text-[hsl(220_90%_55%)]">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-sm font-extrabold tabular-nums leading-none">{sparks}</span>
            </span>
            <span className="h-3 w-px bg-[hsl(220_40%_88%)]" aria-hidden="true" />
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] leading-none bg-gradient-to-r from-[hsl(220_90%_55%)] to-[hsl(258_70%_55%)] bg-clip-text text-transparent">
              Nv {level}{isMax ? " · Máx" : ""}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}