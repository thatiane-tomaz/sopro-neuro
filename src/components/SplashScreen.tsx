import { useState, useEffect } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Show for 2s, then fade out
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2000);

    // Complete after fade animation
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-[#d5e2ea] flex items-center justify-center transition-opacity duration-700 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div 
        className={`text-center transition-opacity duration-700 ${
          fadeOut ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <h1 
          className="text-6xl md:text-8xl font-bold tracking-[0.25em]"
          style={{ color: '#2196F3' }}
        >
          SOPRO
        </h1>
        <p 
          className="text-lg md:text-xl tracking-[0.5em] mt-3 opacity-60"
          style={{ color: '#2196F3' }}
        >
          NEURO
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
