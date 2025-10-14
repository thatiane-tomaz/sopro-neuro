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
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Logo with enhanced animation */}
      <div className="relative z-10 animate-scale-in">
        <div className="relative">
          {/* Glow effect behind logo */}
          <div className="absolute inset-0 bg-white/30 rounded-full blur-2xl animate-pulse" />
          
          {/* Logo */}
          <img 
            src={soproLogo} 
            alt="Sopro" 
            className="relative w-48 h-48 object-contain animate-float drop-shadow-2xl"
          />
        </div>
      </div>
    </main>
  );
};

export default Landing;