import { useState, useEffect } from "react";
import soproLogo from "@/assets/sopro-logo.png";

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
      <img 
        src={soproLogo} 
        alt="Sopro Neuro"
        className={`w-48 md:w-64 h-auto transition-opacity duration-700 ${
          fadeOut ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </div>
  );
};

export default SplashScreen;
