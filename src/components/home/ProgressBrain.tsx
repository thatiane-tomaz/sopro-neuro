import { Lock } from "lucide-react";
import brainDefault from "@/assets/brain/brain-lv5-active.png";

// Warm the browser cache with the mascot image on module load.
if (typeof window !== "undefined") {
  const img = new Image();
  img.decoding = "async";
  img.src = brainDefault;
}

interface Props {
  locked: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  speechTitle?: string;
  speechText?: string;
}

/** Neo mascot with an optional speech bubble. */
export default function ProgressBrain({
  locked,
  onClick,
  ariaLabel,
  speechTitle,
  speechText,
}: Props) {
  const size = 300;
  const brainSize = 158;
  const interactive = typeof onClick === "function";

  const speechBubble = speechText ? (
    <div className="absolute left-1/2 top-6 z-20 w-[238px] -translate-x-1/2 pointer-events-none">
      <div className="relative rounded-[22px] bg-white/55 px-4 py-2.5 text-center ring-1 ring-white/50 shadow-[0_8px_22px_-16px_hsl(258_70%_45%/0.45)] backdrop-blur-md">
        {speechTitle && (
          <span className="block text-[9px] font-black uppercase tracking-[0.16em] leading-none text-[hsl(258_60%_50%)] whitespace-nowrap">
            {speechTitle}
          </span>
        )}
        <span className="mt-1 block text-[13px] font-extrabold leading-snug text-foreground text-balance">
          {speechText}
        </span>
        <span
          aria-hidden
          className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-white/55 ring-1 ring-white/50 backdrop-blur-md"
        />
        <span
          aria-hidden
          className="absolute -bottom-[1px] left-1/2 h-2.5 w-9 -translate-x-1/2 bg-white/55 backdrop-blur-md"
        />
      </div>
    </div>
  ) : null;

  return (
    <div className="relative mx-auto" style={{ width: size, height: speechText ? size + 6 : size }}>
      {speechBubble}

      {/* Soft glow behind brain */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ width: 270, height: 270, background: "var(--gradient-brain-glow)" }}
        aria-hidden="true"
      />

      <div className="absolute inset-0 flex items-center justify-center overflow-visible" style={{ transform: speechText ? "translateY(18px)" : "translateY(-12px)" }}>
        {interactive ? (
          <button
            type="button"
            onClick={onClick}
            aria-label={ariaLabel ?? "Abrir jornada"}
            className="relative rounded-full overflow-visible focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-transform active:scale-95 hover:scale-[1.02]"
            style={{ width: brainSize, height: brainSize }}
          >
            <img
              src={brainDefault}
              alt="Neo"
              width={brainSize}
              height={brainSize}
              loading="eager"
              draggable={false}
              className={`w-full h-full object-contain pointer-events-none animate-pulse-glow ${
                locked ? "grayscale opacity-60" : ""
              }`}
            />
          </button>
        ) : (
          <img
            src={brainDefault}
            alt="Neo"
            width={brainSize}
            height={brainSize}
            loading="eager"
            className={`object-contain animate-pulse-glow ${locked ? "grayscale opacity-60" : ""}`}
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
    </div>
  );
}
