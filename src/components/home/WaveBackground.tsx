import React from "react";
import waveBg from "@/assets/wave-bg.webp";

/**
 * Background image of organic flowing waves (provided by the brand).
 * Fills the entire viewport behind the dashboard content.
 */
export const WaveBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <img
        src={waveBg}
        alt=""
        aria-hidden="true"
        loading="eager"
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Soft white veil to keep content legible */}
      <div className="absolute inset-0 bg-white/30" />
    </div>
  );
};

export default WaveBackground;