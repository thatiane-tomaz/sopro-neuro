import BottomNav from "@/components/home/BottomNav";
import WaveBackground from "@/components/home/WaveBackground";

export default function Controle() {
  return (
    <div className="relative min-h-screen overflow-x-hidden pb-32">
      <WaveBackground />
      <div className="mx-auto max-w-md px-5 pt-[calc(env(safe-area-inset-top)+24px)]">
        <h1 className="text-2xl font-bold text-foreground">Controle</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Em breve: ferramentas para você lidar com gatilhos e a vontade de fumar.
        </p>
      </div>
      <BottomNav />
    </div>
  );
}