import WaveBackground from "@/components/home/WaveBackground";
import soproLogo from "@/assets/sopro-logo.png";

/**
 * Branded full-screen loader used across the app.
 * Replaces the plain spinner for a more premium feel.
 */
export default function PageLoader() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <WaveBackground />
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-5 px-6">
        <img
          src={soproLogo}
          alt="Sopro Neuro"
          className="h-12 w-auto opacity-90 animate-page-in"
          loading="eager"
          decoding="async"
        />
        <div
          className="h-7 w-7 rounded-full border-[2.5px] border-transparent border-t-[hsl(220,90%,55%)] border-r-[hsl(258,70%,55%)] animate-spin"
          aria-label="Carregando"
        />
      </div>
    </div>
  );
}
