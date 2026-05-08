import React from "react";

/**
 * Organic flowing topographic waves — white / soft blue / lilac.
 * Multiple thin curved contour lines layered to evoke fluid energy fields.
 */
export const WaveBackground: React.FC = () => {
  // Generate a set of contour-style wavy lines at varying vertical offsets.
  const lines = Array.from({ length: 14 }, (_, i) => {
    const yBase = 80 + i * 55;
    const amp = 18 + (i % 4) * 6;
    const phase = (i % 3) * 120;
    return { yBase, amp, phase, key: i };
  });

  const buildPath = (yBase: number, amp: number, phase: number) => {
    const pts: string[] = [];
    const steps = 6;
    const w = 1440;
    for (let s = 0; s <= steps; s++) {
      const x = (w / steps) * s;
      const y = yBase + Math.sin((s / steps) * Math.PI * 2 + (phase * Math.PI) / 180) * amp;
      pts.push(s === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
    }
    // Convert to a smoother curve via quadratic interpolation
    return pts.join(" ");
  };

  const buildSmoothPath = (yBase: number, amp: number, phase: number) => {
    const w = 1440;
    const segs = 4;
    const cmds: string[] = [];
    for (let s = 0; s <= segs; s++) {
      const x = (w / segs) * s;
      const y = yBase + Math.sin((s / segs) * Math.PI * 2 + (phase * Math.PI) / 180) * amp;
      if (s === 0) cmds.push(`M ${x} ${y}`);
      else {
        const xPrev = (w / segs) * (s - 1);
        const yPrev = yBase + Math.sin(((s - 1) / segs) * Math.PI * 2 + (phase * Math.PI) / 180) * amp;
        const cx = (xPrev + x) / 2;
        cmds.push(`Q ${cx} ${yPrev} ${x} ${y}`);
      }
    }
    return cmds.join(" ");
  };

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base soft gradient */}
      <div className="absolute inset-0" style={{ background: "var(--gradient-waves)" }} />

      {/* Organic contour lines */}
      <svg
        className="absolute inset-0 w-full h-full opacity-70"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(220 90% 88%)" stopOpacity="0.0" />
            <stop offset="35%" stopColor="hsl(220 90% 80%)" stopOpacity="0.55" />
            <stop offset="65%" stopColor="hsl(258 80% 82%)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="hsl(258 80% 88%)" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {lines.map((l) => (
          <path
            key={l.key}
            d={buildSmoothPath(l.yBase, l.amp, l.phase)}
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth={1.2}
            strokeLinecap="round"
          />
        ))}
      </svg>

      {/* Subtle glow blob top-right */}
      <div
        className="absolute -top-20 -right-20 w-[380px] h-[380px] rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(258 80% 85%), transparent 70%)" }}
      />
      <div
        className="absolute -bottom-24 -left-24 w-[360px] h-[360px] rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(220 90% 88%), transparent 70%)" }}
      />
    </div>
  );
};

export default WaveBackground;