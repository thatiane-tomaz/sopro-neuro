import { useState, useEffect } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [phase, setPhase] = useState<'visible' | 'dissolving' | 'fading'>('visible');

  useEffect(() => {
    // Phase 1: Show text for 1.5s
    const showTimer = setTimeout(() => {
      setPhase('dissolving');
    }, 1500);

    // Phase 2: Dissolve animation for 1.5s, then fade out
    const dissolveTimer = setTimeout(() => {
      setPhase('fading');
    }, 3000);

    // Phase 3: Complete after fade
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3800);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dissolveTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[9999] bg-[#d5e2ea] flex items-center justify-center overflow-hidden transition-opacity duration-700 ${phase === 'fading' ? 'opacity-0' : 'opacity-100'}`}>
      {/* Smoke particles background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full blur-3xl transition-all duration-[2000ms] ${
              phase === 'dissolving' || phase === 'fading' ? 'opacity-60 scale-150' : 'opacity-0 scale-100'
            }`}
            style={{
              width: `${80 + i * 20}px`,
              height: `${80 + i * 20}px`,
              left: `${45 + (i % 3) * 5}%`,
              top: `${40 + (i % 4) * 5}%`,
              background: i % 3 === 0 
                ? 'linear-gradient(135deg, rgba(33, 150, 243, 0.3), rgba(33, 150, 243, 0.1))' 
                : i % 3 === 1 
                  ? 'linear-gradient(135deg, rgba(100, 181, 246, 0.3), rgba(144, 202, 249, 0.1))'
                  : 'linear-gradient(135deg, rgba(213, 226, 234, 0.5), rgba(187, 222, 251, 0.2))',
              transform: phase === 'dissolving' || phase === 'fading' 
                ? `translate(${(i - 6) * 30}px, ${-50 - i * 15}px)` 
                : 'translate(0, 0)',
              transitionDelay: `${i * 80}ms`,
            }}
          />
        ))}
      </div>

      {/* Main text container */}
      <div className="relative text-center">
        {/* SOPRO text */}
        <h1 
          className={`text-6xl md:text-8xl font-bold tracking-[0.3em] transition-all duration-1000 ${
            phase === 'visible' 
              ? 'opacity-100 blur-0 scale-100' 
              : 'opacity-0 blur-lg scale-110'
          }`}
          style={{
            color: '#2196F3',
            textShadow: phase === 'dissolving' 
              ? '0 0 40px rgba(33, 150, 243, 0.5), 0 0 80px rgba(33, 150, 243, 0.3)' 
              : '0 0 20px rgba(33, 150, 243, 0.2)',
          }}
        >
          {'SOPRO'.split('').map((letter, index) => (
            <span
              key={index}
              className={`inline-block transition-all duration-700 ${
                phase === 'dissolving' || phase === 'fading' ? 'opacity-0' : 'opacity-100'
              }`}
              style={{
                transitionDelay: `${index * 100}ms`,
                transform: phase === 'dissolving' || phase === 'fading' 
                  ? `translateY(${-20 - index * 5}px) rotate(${(index - 2) * 3}deg) scale(1.1)` 
                  : 'translateY(0) rotate(0) scale(1)',
              }}
            >
              {letter}
            </span>
          ))}
        </h1>

        {/* NEURO subtitle */}
        <p 
          className={`text-lg md:text-xl tracking-[0.5em] mt-4 transition-all duration-700 ${
            phase === 'visible' 
              ? 'opacity-60 blur-0' 
              : 'opacity-0 blur-md'
          }`}
          style={{
            color: '#2196F3',
            transitionDelay: phase === 'dissolving' ? '200ms' : '0ms',
          }}
        >
          NEURO
        </p>

        {/* Smoke wisps emanating from text */}
        {(phase === 'dissolving' || phase === 'fading') && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={`wisp-${i}`}
                className="absolute left-1/2 top-1/2 rounded-full animate-pulse"
                style={{
                  width: `${30 + i * 10}px`,
                  height: `${30 + i * 10}px`,
                  background: `radial-gradient(circle, rgba(33, 150, 243, ${0.2 - i * 0.02}) 0%, transparent 70%)`,
                  transform: `translate(-50%, -50%) translate(${Math.sin(i * 0.8) * 60}px, ${-30 - i * 20}px)`,
                  filter: 'blur(8px)',
                  animation: `float-up-${i} 2s ease-out forwards`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes float-up-0 { to { transform: translate(-50%, -50%) translate(${Math.sin(0) * 80}px, -150px); opacity: 0; } }
        @keyframes float-up-1 { to { transform: translate(-50%, -50%) translate(${Math.sin(0.8) * 80}px, -170px); opacity: 0; } }
        @keyframes float-up-2 { to { transform: translate(-50%, -50%) translate(${Math.sin(1.6) * 80}px, -190px); opacity: 0; } }
        @keyframes float-up-3 { to { transform: translate(-50%, -50%) translate(${Math.sin(2.4) * 80}px, -210px); opacity: 0; } }
        @keyframes float-up-4 { to { transform: translate(-50%, -50%) translate(${Math.sin(3.2) * 80}px, -230px); opacity: 0; } }
        @keyframes float-up-5 { to { transform: translate(-50%, -50%) translate(${Math.sin(4) * 80}px, -250px); opacity: 0; } }
        @keyframes float-up-6 { to { transform: translate(-50%, -50%) translate(${Math.sin(4.8) * 80}px, -270px); opacity: 0; } }
        @keyframes float-up-7 { to { transform: translate(-50%, -50%) translate(${Math.sin(5.6) * 80}px, -290px); opacity: 0; } }
      `}</style>
    </div>
  );
};

export default SplashScreen;
