import brainImg from "@/assets/brain-3d.png";
import { Lock } from "lucide-react";

interface Props {
  progress: number; // 0-100
  locked: boolean;
}

/**
 * Open-bottom 3/4 circular progress arc with the 3D brain centered.
 * The arc starts at bottom-left, goes counter-clockwise across the top,
 * and ends at bottom-right, leaving a gap at the bottom (matches ref).
 */
export default function ProgressBrain({ progress, locked }: Props) {
  const clamped = Math.max(0, Math.min(100, progress));

  const size = 340;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 150;

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
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full"
        style={{ background: "var(--gradient-brain-glow)" }}
        aria-hidden="true"
      />

      {/* Brain centered, sized to fill the arc */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={brainImg}
          alt="Cérebro"
          width={310}
          height={310}
          loading="eager"
          className={`w-[310px] h-[310px] object-contain animate-pulse-glow ${
            locked ? "grayscale opacity-60" : ""
          }`}
        />
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