import { useState, useEffect } from "react";
import soproLogo from "@/assets/sopro-logo.png";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [phase, setPhase] = useState<'visible' | 'fading' | 'done'>('visible');
  const [letterOpacities, setLetterOpacities] = useState([1, 1, 1, 1, 1]); // S O P R O

  useEffect(() => {
    // Show logo for 1.5s
    const startFadeTimer = setTimeout(() => {
      setPhase('fading');
      
      // Fade each letter one by one with soft timing
      const letters = [0, 1, 2, 3, 4];
      letters.forEach((index) => {
        setTimeout(() => {
          setLetterOpacities(prev => {
            const newOpacities = [...prev];
            newOpacities[index] = 0;
            return newOpacities;
          });
        }, index * 250); // 250ms between each letter
      });
    }, 1500);

    // Complete after all letters fade
    const completeTimer = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 3200);

    return () => {
      clearTimeout(startFadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // Create a mask effect using the logo as reference but with animated opacity per "section"
  const letterPositions = [
    { left: '0%', width: '18%' },   // S
    { left: '18%', width: '22%' },  // O
    { left: '40%', width: '18%' },  // P
    { left: '58%', width: '22%' },  // R
    { left: '80%', width: '20%' },  // O
  ];

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-700 ${
        phase === 'done' ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: 'linear-gradient(180deg, #d5e2ea 0%, #cde0ed 50%, #d5e2ea 100%)',
      }}
    >
      {/* Subtle ambient glow */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: 'radial-gradient(ellipse at 50% 45%, rgba(33, 150, 243, 0.12) 0%, transparent 50%)',
        }}
      />
      
      {/* Logo with letter-by-letter fade effect */}
      <div className="relative w-52 md:w-72">
        {/* Base logo (hidden, just for sizing) */}
        <img 
          src={soproLogo} 
          alt="Sopro Neuro"
          className="w-full h-auto opacity-0"
        />
        
        {/* Layered sections that fade independently */}
        <div className="absolute inset-0 flex">
          {letterPositions.map((pos, index) => (
            <div
              key={index}
              className="h-full overflow-hidden transition-all duration-700 ease-out"
              style={{
                width: pos.width,
                opacity: letterOpacities[index],
                filter: letterOpacities[index] === 0 ? 'blur(8px)' : 'blur(0px)',
                transform: letterOpacities[index] === 0 ? 'translateY(-10px)' : 'translateY(0)',
              }}
            >
              <img 
                src={soproLogo} 
                alt=""
                className="h-full w-auto max-w-none"
                style={{
                  marginLeft: `-${parseFloat(pos.left) / parseFloat(pos.width) * 100}%`,
                  width: `${100 / parseFloat(pos.width) * 100}%`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
