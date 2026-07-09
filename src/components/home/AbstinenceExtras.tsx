import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Headphones, Play, Zap, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsFreelist } from "@/hooks/useIsFreelist";
import { useSosHypnosis } from "@/hooks/useSosHypnosis";
import { useJourneyTracking } from "@/hooks/useJourneyTracking";
import MediaPlayer from "@/components/MediaPlayer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const STORAGE_BASE =
  "https://kpewsvpufzkyejchncta.supabase.co/storage/v1/object/public/hypnosis";

interface TriggerItem {
  id: string;
  title: string;
  description: string | null;
  file_name: string;
  duration_minutes: number | null;
  display_order: number | null;
}

export default function AbstinenceExtras({
  mode = "extras",
}: {
  mode?: "extras" | "return";
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { isPremium } = useSubscription();
  const { isFreelist } = useIsFreelist();
  const { getSosHypnosis } = useSosHypnosis();
  const { startTracking, updateProgress } = useJourneyTracking();
  const queryClient = useQueryClient();

  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const { data: triggers = [] } = useQuery({
    queryKey: ["triggers_content_active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("triggers_content")
        .select("id,title,description,file_name,duration_minutes,display_order")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) return [] as TriggerItem[];
      return (data || []) as TriggerItem[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const canPlay = isAdmin || isPremium || isFreelist;
  const ensureAccess = () => {
    if (canPlay) return true;
    navigate("/paywall");
    return false;
  };

  const openMedia = async (title: string, fileUrl: string, interactionType: string) => {
    if (!ensureAccess()) return;
    setSelectedMedia({ title, fileUrl, contentType: "hypnosis" as const, interactionType });
    try {
      const r = await startTracking({ interactionType });
      if (r?.id) setTrackingId(r.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSos = () => {
    if (!ensureAccess()) return;
    const sos = getSosHypnosis();
    openMedia(sos.title, sos.fileUrl, `sos_${sos.index + 1}`);
  };

  const handleTrigger = (t: TriggerItem) =>
    openMedia(
      t.title,
      `${STORAGE_BASE}/${t.file_name}`,
      `gatilho_${t.file_name.replace(/\.[^.]+$/, "")}`
    );

  const handleProgress = (p: number) => {
    if (!trackingId) return;
    updateProgress({ trackingId, progressPercentage: p, finished: p >= 85 });
  };
  const handleComplete = () => {
    if (!trackingId) return;
    updateProgress({ trackingId, progressPercentage: 100, finished: true });
    toast({ title: "Progresso salvo!" });
  };

  const handleReturnToReducao = async () => {
    if (!user) return;
    setSwitching(true);
    const { error } = await supabase
      .from("historico_jornada_usuario")
      .insert({ user_id: user.id, jornada: "reducao" } as any);
    setSwitching(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Tudo bem, recomeçar faz parte",
      description: "Você voltou para a jornada de redução.",
    });
    setConfirmOpen(false);
    queryClient.invalidateQueries({ queryKey: ["jornada-type"] });
    queryClient.invalidateQueries({ queryKey: ["gatilho-jornada"] });
  };

  return (
    <>
      {mode === "extras" && (
        <>
      {/* SOS */}
      <button
        onClick={handleSos}
        className="mt-6 w-full text-left rounded-3xl p-5 shadow-[0_18px_50px_-18px_hsl(230_70%_40%/0.5)] ring-1 ring-white/10 active:scale-[0.99] transition-transform"
        style={{
          background: "linear-gradient(135deg, hsl(220, 90%, 55%), hsl(258, 70%, 55%))",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 flex-shrink-0 rounded-full bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
            <Zap className="h-6 w-6 text-white" strokeWidth={2.5} fill="white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-base font-bold leading-tight whitespace-nowrap">
              Vontade de fumar agora?
            </p>
            <p className="text-white/85 text-xs leading-snug mt-1 whitespace-nowrap">
              Hipnose rápida para alívio imediato.
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-[hsl(258_70%_50%)] shadow-md">
            <Play className="h-4 w-4 fill-current" /> Iniciar agora
          </span>
        </div>
      </button>

      {/* Triggers */}
      <div className="mt-7">
        <h2 className="text-lg font-bold text-foreground">
          Hipnoses para gatilhos específicos
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Fortaleça sua mente para enfrentar momentos desafiadores.
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {triggers.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTrigger(t)}
            className="w-full flex items-center gap-3 rounded-2xl bg-white/85 backdrop-blur-md ring-1 ring-black/[0.03] shadow-[0_10px_30px_-18px_hsl(230_60%_40%/0.25)] p-3.5 text-left active:scale-[0.99] transition-transform"
          >
            <div className="h-12 w-12 flex-shrink-0 rounded-full bg-[hsl(180_55%_94%)] flex items-center justify-center">
              <Headphones className="h-5 w-5 text-[hsl(185_60%_45%)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground leading-tight">
                {t.title}
              </p>
              {t.description && (
                <p className="text-xs text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                  {t.description}
                </p>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-[hsl(220_70%_55%)] flex-shrink-0" />
          </button>
        ))}
      </div>

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
      )}

      {mode === "return" && (
        <div className="mt-8">
        <button
          onClick={() => setConfirmOpen(true)}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white/70 backdrop-blur px-4 py-3 text-xs font-semibold text-[hsl(258_60%_45%)] ring-1 ring-[hsl(258_70%_90%)] shadow-sm active:scale-[0.98] transition-transform"
        >
          <RotateCcw className="h-4 w-4" />
          Voltei a fumar, quero retornar à jornada de redução
        </button>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm rounded-3xl border-0 bg-white shadow-[0_24px_60px_-20px_hsl(258_60%_40%/0.4)]">
          <DialogHeader className="text-left">
            <DialogTitle className="text-base font-bold">
              Voltar para a jornada de redução?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Tudo bem recomeçar. Vamos ajustar seus conteúdos para focar em reduzir aos poucos, sem cobrança.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setConfirmOpen(false)}
              disabled={switching}
            >
              Agora não
            </Button>
            <Button
              className="flex-1 rounded-xl bg-gradient-to-br from-[hsl(258_70%_55%)] to-[hsl(280_70%_60%)] text-white"
              disabled={switching}
              onClick={handleReturnToReducao}
            >
              {switching ? "Salvando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}