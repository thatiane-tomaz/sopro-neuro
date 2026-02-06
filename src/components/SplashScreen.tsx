import { useState, useEffect } from "react";
import soproLogo from "@/assets/sopro-logo.png";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [phase, setPhase] = useState<'visible' | 'dissolving' | 'revealing'>('visible');

  useEffect(() => {
    // Phase 1: Show logo for 1.8s
    const dissolveTimer = setTimeout(() => {
      setPhase('dissolving');
    }, 1800);

    // Phase 2: Start revealing background
    const revealTimer = setTimeout(() => {
      setPhase('revealing');
    }, 2600);

    // Phase 3: Complete transition
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3400);

    return () => {
      clearTimeout(dissolveTimer);
      clearTimeout(revealTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-1000 ease-out ${
        phase === 'revealing' ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
      }`}
      style={{
        background: phase === 'revealing' 
          ? 'transparent' 
          : 'linear-gradient(180deg, #d5e2ea 0%, #c5d8e8 50%, #d5e2ea 100%)',
      }}
    >
      {/* Subtle ambient glow */}
      <div 
        className={`absolute inset-0 transition-opacity duration-1000 ${
          phase === 'visible' ? 'opacity-30' : 'opacity-0'
        }`}
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(33, 150, 243, 0.15) 0%, transparent 60%)',
        }}
      />
      
      {/* Logo container with dissolve effect */}
      <div 
        className={`relative transition-all ease-out ${
          phase === 'visible' 
            ? 'opacity-100 blur-0 scale-100 duration-500' 
            : phase === 'dissolving'
              ? 'opacity-60 blur-[2px] scale-[1.02] duration-800'
              : 'opacity-0 blur-md scale-110 duration-700'
        }`}
      >
        <img 
          src={soproLogo} 
          alt="Sopro Neuro"
          className="w-52 md:w-72 h-auto"
          style={{
            filter: phase === 'dissolving' 
              ? 'drop-shadow(0 0 30px rgba(33, 150, 243, 0.3))' 
              : phase === 'visible'
                ? 'drop-shadow(0 0 15px rgba(33, 150, 243, 0.15))'
                : 'none',
          }}
        />
      </div>
    </div>
  );
};

export default SplashScreen;
