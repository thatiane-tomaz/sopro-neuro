import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import soproLogo from "@/assets/sopro-logo.png";

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-accent flex items-center justify-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-accent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-light rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Logo with dramatic animation */}
      <div className="relative z-10 animate-[scale-in_0.8s_ease-out]">
        <div className="relative">
          {/* Multiple glow layers for dramatic effect */}
          <div className="absolute inset-0 bg-white/50 rounded-full blur-3xl animate-pulse scale-150" />
          <div className="absolute inset-0 bg-accent/40 rounded-full blur-2xl animate-pulse scale-125" style={{ animationDelay: "0.3s" }} />
          
          {/* Logo */}
          <img 
            src={soproLogo} 
            alt="Sopro" 
            className="relative w-64 h-64 object-contain animate-[float_3s_ease-in-out_infinite] drop-shadow-[0_0_50px_rgba(255,255,255,0.8)]"
          />
        </div>
      </div>
    </main>
  );
};

export default Landing;