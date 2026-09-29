import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsFreelist } from "@/hooks/useIsFreelist";
import { useSosHypnosis } from "@/hooks/useSosHypnosis";
import { useJourneyTracking } from "@/hooks/useJourneyTracking";
import MediaPlayer from "@/components/MediaPlayer";

/**
 * Bloco fino do SOS — aparece logo após o "Foco atual" no Dashboard.
 * Estilo: cartão claro com ícone de raio, pergunta e botão "Ajuda agora".
 */
export default function SosThinBlock() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useIsAdmin();
  const { isPremium } = useSubscription();
  const { isFreelist } = useIsFreelist();
  const { getSosHypnosis } = useSosHypnosis();
  const { startTracking, updateProgress } = useJourneyTracking();

  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);

  const canPlay = isAdmin || isPremium || isFreelist;

  const openMedia = async (title: string, fileUrl: string, interactionType: string) => {
    setSelectedMedia({ title, fileUrl, contentType: "hypnosis" as const, interactionType });
    try {
      const r = await startTracking({ interactionType });
      if (r?.id) setTrackingId(r.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSos = async () => {
    if (!canPlay) {
      navigate("/paywall");
      return;
    }
    const sos = await getSosHypnosis();
    if (!sos.fileUrl) return;
    openMedia(sos.title, sos.fileUrl, `sos_${sos.index + 1}`);
  };

  const handleProgress = (p: number) => {
    if (!trackingId) return;
    updateProgress({ trackingId, progressPercentage: p, finished: p >= 85 });
  };
  const handleComplete = () => {
    if (!trackingId) return;
    updateProgress({ trackingId, progressPercentage: 100, finished: true });
    toast({ title: "Progresso salvo!" });
  };

  return (
    <>
      <button
        onClick={handleSos}
        aria-label="Ajuda agora: hipnose rápida contra a vontade de fumar"
        className="mt-6 w-full flex items-center gap-3 rounded-2xl bg-gradient-to-br from-[hsl(258_80%_98%)] to-[hsl(220_80%_98%)] px-3.5 py-3 shadow-[0_6px_20px_-12px_hsl(258_70%_45%/0.25)] ring-1 ring-[hsl(258_70%_92%)] active:scale-[0.99] transition-transform text-left"
      >
        <Zap
          className="h-5 w-5 flex-shrink-0 text-[hsl(258_70%_55%)]"
          strokeWidth={2.5}
          fill="currentColor"
        />
        <span className="flex-1 min-w-0 text-sm font-bold text-[hsl(258_60%_45%)] whitespace-nowrap">
          Vontade de fumar?
        </span>
        <span className="flex-shrink-0 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-[hsl(220_90%_55%)] to-[hsl(258_70%_55%)] px-4 py-2 text-xs font-bold text-primary-foreground shadow-[0_8px_20px_-8px_hsl(258_70%_50%/0.6)]">
          Ajuda agora
        </span>
      </button>

      {selectedMedia && (
        <MediaPlayer
          title={selectedMedia.title}
          fileUrl={selectedMedia.fileUrl}
          contentType={selectedMedia.contentType}
          interactionType={selectedMedia.interactionType}
          onClose={() => {
            setSelectedMedia(null);
            setTrackingId(null);
          }}
          onProgress={handleProgress}
          onComplete={handleComplete}
        />
      )}
    </>
  );
}
