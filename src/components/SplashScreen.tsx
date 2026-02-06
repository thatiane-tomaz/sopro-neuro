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
      <div className="fixed inset-0 z-[9999] bg-[#D9E4EC] flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold text-[#2196F3] tracking-wider animate-pulse">
            SOPRO
          </h1>
          <p className="text-[#2196F3]/60 mt-4 text-lg tracking-widest">
            NEURO
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#D9E4EC] flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnd}
        onError={handleVideoError}
        className="w-auto h-auto min-w-full min-h-full object-contain"
        controlsList="nodownload"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
      />
      {/* Blur gradient edges */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top edge */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#D9E4EC] to-transparent" style={{ filter: 'blur(8px)' }} />
        {/* Bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#D9E4EC] to-transparent" style={{ filter: 'blur(8px)' }} />
        {/* Left edge */}
        <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-[#D9E4EC] to-transparent" style={{ filter: 'blur(8px)' }} />
        {/* Right edge */}
        <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-[#D9E4EC] to-transparent" style={{ filter: 'blur(8px)' }} />
      </div>
    </div>
  );
};

export default SplashScreen;
