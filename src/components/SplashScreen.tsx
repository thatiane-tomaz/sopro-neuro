import { useState, useRef, useEffect } from "react";

interface SplashScreenProps {
  onComplete: () => void;
  videoSrc?: string;
}

const SplashScreen = ({ onComplete, videoSrc }: SplashScreenProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // If no video source, show fallback animation then complete
    if (!videoSrc) {
      setShowFallback(true);
      const timer = setTimeout(() => {
        onComplete();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [videoSrc, onComplete]);

  const handleVideoEnd = () => {
    onComplete();
  };

  const handleVideoError = () => {
    // If video fails to load, show fallback
    setShowFallback(true);
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);
    return () => clearTimeout(timer);
  };

  // Fallback animated splash when no video
  if (showFallback || !videoSrc) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#1A1F2C] flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-wider animate-pulse">
            SOPRO
          </h1>
          <p className="text-white/60 mt-4 text-lg tracking-widest">
            NEURO
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#1A1F2C] flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnd}
        onError={handleVideoError}
        className="w-full h-full object-cover"
        controlsList="nodownload"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
};

export default SplashScreen;
