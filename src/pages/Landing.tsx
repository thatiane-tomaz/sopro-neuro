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

      {/* Logo and name */}
      <div className="relative z-10 flex flex-col items-center gap-8 animate-fade-in">
        <img 
          src={soproLogo} 
          alt="Sopro" 
          className="w-32 h-32 object-contain animate-float"
        />
        <h1 className="text-6xl font-bold text-white tracking-wider">
          Sopro
        </h1>
      </div>
    </main>
  );
};

export default Landing;