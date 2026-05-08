import brainImg from "@/assets/brain-3d.png";
import { Lock } from "lucide-react";

interface Props {
  progress: number; // 0-100
  locked: boolean;
}

/**
 * Semicircle progress arc with the 3D brain centered.
 */
export default function ProgressBrain({ progress, locked }: Props) {
  const clamped = Math.max(0, Math.min(100, progress));
  const radius = 120;
  const cx = 140;
  const cy = 140;
  // Half circle path from left to right (top arc only)
  const start = { x: cx - radius, y: cy };
  const end = { x: cx + radius, y: cy };
  const arcLen = Math.PI * radius; // length of half circle
  const dash = (clamped / 100) * arcLen;

  return (
    <div className="relative mx-auto" style={{ width: 280, height: 170 }}>
      <svg width={280} height={170} viewBox="0 0 280 170" className="absolute inset-0">
        <defs>
          <linearGradient id="arcGrad" x1="0" x2="1">
            <stop offset="0%" stopColor="hsl(230 85% 60%)" />
            <stop offset="100%" stopColor="hsl(258 80% 65%)" />
          </linearGradient>
        </defs>
        {/* Track */}
        <path
          d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`}
          fill="none"
          stroke="hsl(258 60% 92%)"
          strokeWidth={10}
          strokeLinecap="round"
        />
        {/* Filled */}
        <path
          d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`}
          fill="none"
          stroke="url(#arcGrad)"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${arcLen}`}
          style={{ transition: "stroke-dasharray 1.2s ease-out" }}
        />
      </svg>
      <div
        className="absolute left-1/2 -translate-x-1/2 top-2 w-[180px] h-[180px] rounded-full"
        style={{ background: "var(--gradient-brain-glow)" }}
        aria-hidden="true"
      />
      <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[180px] h-[180px] flex items-center justify-center">
        <img
          src={brainImg}
          alt="Cérebro"
          width={180}
          height={180}
          loading="eager"
          className={`w-[170px] h-[170px] object-contain animate-pulse-glow ${
            locked ? "grayscale opacity-60" : ""
          }`}
        />
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-md">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}