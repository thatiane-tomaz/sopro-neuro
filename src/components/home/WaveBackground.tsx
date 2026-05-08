import React from "react";

/**
 * Soft animated organic waves background — white / light blue / lilac.
 */
export const WaveBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0"
        style={{ background: "var(--gradient-waves)" }}
      />
      <svg
        className="absolute inset-x-0 top-0 w-full h-[60%] opacity-60 animate-wave-slow"
        viewBox="0 0 1440 600"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="waveA" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="hsl(220 80% 92%)" />
            <stop offset="100%" stopColor="hsl(258 80% 94%)" />
          </linearGradient>
        </defs>
        <path
          fill="url(#waveA)"
          d="M0,180 C240,260 480,80 720,160 C960,240 1200,120 1440,200 L1440,0 L0,0 Z"
        />
        <path
          fill="hsl(258 80% 96%)"
          opacity="0.7"
          d="M0,320 C240,400 480,260 720,320 C960,380 1200,260 1440,340 L1440,600 L0,600 Z"
        />
      </svg>
    </div>
  );
};

export default WaveBackground;