import brainImg from "@/assets/brain-user.png";
import { Lock, Sparkles } from "lucide-react";
import { useMemo } from "react";

interface Props {
  progress: number; // 0-100
  locked: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}

function OrbitingParticle({
  delay,
  durationClass,
  sizeClass,
  colorClass,
  reverse,
  radiusOffset = 0,
}: {
  delay: string;
  durationClass: string;
  sizeClass: string;
  colorClass: string;
  reverse?: boolean;
  radiusOffset?: number;
}) {
  const animClass = reverse ? "animate-orbit-reverse" : durationClass;
  const style: React.CSSProperties = {
    animationDelay: delay,
    marginLeft: -radiusOffset / 2,
    marginTop: -radiusOffset / 2,
  };
  return (
    <div
      className={`absolute left-1/2 top-1/2 rounded-full ${sizeClass} ${colorClass} ${animClass}`}
      style={style}
      aria-hidden="true"
    />
  );
}

function FloatingParticle({
  left,
  bottom,
  delay,
  sizeClass,
  colorClass,
}: {
  left: string;
  bottom: string;
  delay: string;
  sizeClass: string;
  colorClass: string;
}) {
  return (
    <div
      className={`absolute rounded-full ${sizeClass} ${colorClass} animate-float-particle`}
      style={{ left, bottom, animationDelay: delay }}
      aria-hidden="true"
    />
  );
}

/**
 * Enchanted brain with orbiting particles, floating sparkles, and organic motion.
 */
export default function ProgressBrain({ progress, locked, onClick, ariaLabel }: Props) {
  const clamped = Math.max(0, Math.min(100, progress));

  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 130;

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

  // Tip of the filled arc
  const tipAngle = startAngle + (sweep * clamped) / 100;
  const tip = useMemo(() => toXY(tipAngle), [tipAngle]);

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      {/* ==== Enchanted background glow (breathing) ==== */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full animate-glow-breathe"
        style={{
          background:
            "radial-gradient(circle, hsl(258 70% 75% / 0.22), hsl(200 70% 60% / 0.1) 50%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* ==== Orbiting particles ==== */}
      {!locked && (
        <>
          <OrbitingParticle
            delay="0s"
            durationClass="animate-orbit"
            sizeClass="w-2 h-2"
            colorClass="bg-primary/60 shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
          />
          <OrbitingParticle
            delay="-4s"
            durationClass="animate-orbit-slow"
            sizeClass="w-1.5 h-1.5"
            colorClass="bg-accent/70 shadow-[0_0_6px_hsl(var(--accent)/0.5)]"
            radiusOffset={16}
          />
          <OrbitingParticle
            delay="-9s"
            durationClass="animate-orbit-reverse"
            sizeClass="w-2.5 h-2.5"
            colorClass="bg-lilac/50 shadow-[0_0_10px_hsl(258_70%_65%/0.4)]"
            radiusOffset={32}
          />
          <OrbitingParticle
            delay="-2s"
            durationClass="animate-orbit-slow"
            sizeClass="w-1 h-1"
            colorClass="bg-white/80 shadow-[0_0_6px_rgba(255,255,255,0.6)]"
            radiusOffset={-12}
          />
        </>
      )}

      {/* ==== Floating rising particles ==== */}
      {!locked && (
        <>
          <FloatingParticle left="20%" bottom="10%" delay="0s" sizeClass="w-1.5 h-1.5" colorClass="bg-primary/40" />
          <FloatingParticle left="70%" bottom="15%" delay="1.2s" sizeClass="w-1 h-1" colorClass="bg-accent/50" />
          <FloatingParticle left="45%" bottom="5%" delay="2.5s" sizeClass="w-2 h-2" colorClass="bg-lilac/30" />
          <FloatingParticle left="85%" bottom="25%" delay="3.8s" sizeClass="w-1 h-1" colorClass="bg-white/50" />
          <FloatingParticle left="10%" bottom="30%" delay="4.5s" sizeClass="w-1.5 h-1.5" colorClass="bg-primary/30" />
        </>
      )}

      {/* ==== Progress arc ==== */}
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
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <path d={arcPath} fill="none" stroke="hsl(220 40% 92%)" strokeWidth={10} strokeLinecap="round" />

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

        {/* Sparkle at the tip of progress */}
        {clamped > 0 && clamped < 100 && !locked && (
          <g>
            <circle
              cx={tip.x}
              cy={tip.y}
              r={5}
              fill="white"
              opacity={0.9}
              className="animate-sparkle"
              style={{ transformOrigin: `${tip.x}px ${tip.y}px` }}
            />
            <circle
              cx={tip.x}
              cy={tip.y}
              r={10}
              fill="url(#arcGrad)"
              opacity={0.35}
              className="animate-sparkle"
              style={{ animationDelay: "0.4s", transformOrigin: `${tip.x}px ${tip.y}px` }}
            />
          </g>
        )}

        {/* Completion sparkle burst */}
        {clamped >= 100 && !locked && (
          <g>
            <circle cx={end.x} cy={end.y} r={6} fill="white" opacity={0.9} className="animate-sparkle" />
            <circle
              cx={end.x}
              cy={end.y}
              r={14}
              fill="url(#arcGrad)"
              opacity={0.3}
              className="animate-sparkle"
              style={{ animationDelay: "0.3s" }}
            />
            <circle
              cx={start.x}
              cy={start.y}
              r={5}
              fill="white"
              opacity={0.7}
              className="animate-sparkle"
              style={{ animationDelay: "0.6s" }}
            />
          </g>
        )}
      </svg>

      {/* ==== Soft lilac glow behind brain ==== */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full animate-pulse-glow"
        style={{ background: "var(--gradient-brain-glow)" }}
        aria-hidden="true"
      />

      {/* ==== Brain (floating) ==== */}
      <div
        className={`absolute inset-0 flex items-center justify-center ${!locked ? "animate-float" : ""}`}
        style={{ transform: "translateY(-6px)" }}
      >
        {interactive ? (
          <button
            type="button"
            onClick={onClick}
            aria-label={ariaLabel ?? "Abrir jornada"}
            className="relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-transform active:scale-95 hover:scale-[1.02]"
          >
            <img
              src={brainImg}
              alt="Cérebro"
              width={340}
              height={340}
              loading="eager"
              draggable={false}
              className={`w-[340px] h-[340px] object-contain animate-pulse-glow pointer-events-none ${
                locked ? "grayscale opacity-60" : ""
              }`}
            />
            {!locked && (
              <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center -translate-y-1 select-none">
                <span
                  className="text-xl font-bold text-white leading-none text-center px-4"
                  style={{ textShadow: "0 2px 8px hsl(230 60% 25% / 0.55)" }}
                >
                  Olá!
                </span>
                <span
                  className="mt-1 text-[10px] font-semibold text-white/90 text-center px-4"
                  style={{ textShadow: "0 1px 4px hsl(230 60% 25% / 0.55)" }}
                >
                  Toque para conversar
                </span>
              </span>
            )}
          </button>
        ) : (
          <img
            src={brainImg}
            alt="Cérebro"
            width={340}
            height={340}
            loading="eager"
            className={`w-[340px] h-[340px] object-contain animate-pulse-glow ${
              locked ? "grayscale opacity-60" : ""
            }`}
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

      {/* ==== Decorative sparkle corners ==== */}
      {!locked && (
        <>
          <Sparkles
            className="absolute top-4 left-6 w-4 h-4 text-primary/30 animate-sparkle"
            style={{ animationDelay: "0.8s" } as React.CSSProperties}
          />
          <Sparkles
            className="absolute top-8 right-10 w-3 h-3 text-accent/40 animate-sparkle"
            style={{ animationDelay: "1.6s" } as React.CSSProperties}
          />
          <Sparkles
            className="absolute bottom-16 left-10 w-3.5 h-3.5 text-lilac/30 animate-sparkle"
            style={{ animationDelay: "2.2s" } as React.CSSProperties}
          />
        </>
      )}
    </div>
  );
}
