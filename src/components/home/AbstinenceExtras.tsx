import { getSignedMediaUrl } from "@/lib/mediaUrl";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Headphones, Play, Zap, RotateCcw, Sparkles } from "lucide-react";
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

const HYPNOSIS_BUCKET = "hypnosis";

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

  const handleSos = async () => {
    if (!ensureAccess()) return;
    const sos = await getSosHypnosis();
    if (!sos.fileUrl) return;
    openMedia(sos.title, sos.fileUrl, `sos_${sos.index + 1}`);
  };

  const handleTrigger = async (t: TriggerItem) => {
    if (!ensureAccess()) return;
    const url = await getSignedMediaUrl("hipnoses_2", t.file_name, "hypnosis", [
      HYPNOSIS_BUCKET,
      "hipnoses_2",
    ]);
    if (!url) {
      toast({
        title: "Conteúdo em preparação",
        description: "Esta hipnose ainda não está disponível. Tente novamente em breve.",
        variant: "destructive",
      });
      return;
    }
    openMedia(
      t.title,
      url,
      `gatilho_${t.file_name.replace(/\.[^.]+$/, "")}`
    );
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

  const handleReturnToReducao = async () => {
    if (!user) return;
    setSwitching(true);
    try {
      // Load all reducao habits + user's tracking to hand to the AI
      const [{ data: habitos }, { data: tracking }, onbRes, histRes] = await Promise.all([
        (supabase as any)
          .from("habitos_jornada")
          .select("id,habito_titulo,tema_fixo,posicao")
          .eq("tipo_usuario", "redução"),
        supabase
          .from("journey_tracking")
          .select("interaction_type,finished_at")
          .eq("user_id", user.id)
          .not("finished_at", "is", null),
        (supabase as any)
          .from("onboarding_responses_v2")
          .select("respostas")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        (supabase as any)
          .from("historico_jornada_usuario")
          .select("habitos_selecionados")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      // Triggers/habits the user had before: the AI must revisit each of them.
      const previousFromHistorico = Array.isArray(histRes?.data?.habitos_selecionados)
        ? (histRes.data.habitos_selecionados as string[])
        : [];
      const previousFromOnboarding = Array.isArray(
        onbRes?.data?.respostas?.habitosSelecionados,
      )
        ? (onbRes.data.respostas.habitosSelecionados as string[])
        : [];
      const gatilhosAnteriores = Array.from(
        new Set(
          [...previousFromHistorico, ...previousFromOnboarding].filter(
            (t) => typeof t === "string" && t.trim(),
          ),
        ),
      );
      const doneTypes = new Set(
        (tracking ?? []).map((t: any) => t.interaction_type as string),
      );
      const jaCompletadosCount = Array.from(doneTypes).filter(
        (t) => t.startsWith("video_semana_") || t.startsWith("hipnose_semana_"),
      ).length;
      const habitosResumo = (habitos ?? [])
        .sort((a: any, b: any) => (Number(a.posicao ?? 999) - Number(b.posicao ?? 999)))
        .map((h: any) => ({
          titulo: h.habito_titulo as string,
          tema_fixo: !!h.tema_fixo,
        }));
      setConfirmOpen(false);
      navigate("/chat", {
        state: {
          retorno: {
            habitos: habitosResumo,
            habitosJaCompletadosCount: jaCompletadosCount,
            gatilhosAnteriores,
          },
        },
      });
    } catch (e: any) {
      toast({
        title: "Erro",
        description: e?.message ?? "Não foi possível iniciar.",
        variant: "destructive",
      });
    } finally {
      setSwitching(false);
    }
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

      {/* Triggers — mesma identidade visual da seção "Foco atual" */}
      <section className="mt-7 rounded-3xl bg-white/80 backdrop-blur-md p-4 shadow-[0_18px_50px_-18px_hsl(230_60%_40%/0.18)] ring-1 ring-black/[0.03]">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1.5 min-w-0">
            <Sparkles className="h-3 w-3 flex-shrink-0 text-[hsl(258_65%_52%)]" />
            <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[hsl(258_60%_45%)]">
              Gatilhos
            </span>
          </div>
        </div>

        <h2 className="mt-1 text-lg sm:text-xl font-bold bg-gradient-to-r from-[hsl(220_90%_55%)] to-[hsl(258_70%_55%)] bg-clip-text text-transparent leading-tight">
          Hipnoses de Apoio
        </h2>

        <div className="mt-3 pt-3 border-t border-[hsl(220_30%_94%)] space-y-2">
          {triggers.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTrigger(t)}
              className="w-full flex items-center gap-3 rounded-2xl bg-white/70 ring-1 ring-[hsl(220_30%_94%)] p-3 text-left active:scale-[0.99] transition-transform"
            >
              <div className="h-11 w-11 flex-shrink-0 rounded-full bg-gradient-to-br from-[hsl(258_70%_60%)] to-[hsl(280_70%_65%)] flex items-center justify-center shadow-[0_8px_20px_-10px_hsl(258_70%_50%/0.6)]">
                <Headphones className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-foreground leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                  {t.title}
                </p>
                {t.description && (
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                    {t.description}
                  </p>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-[hsl(258_60%_55%)] flex-shrink-0" />
            </button>
          ))}
        </div>
      </section>

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
          className="w-full flex items-center justify-start gap-2 rounded-2xl bg-white/70 backdrop-blur px-4 py-3 text-xs font-semibold text-[hsl(258_60%_45%)] ring-1 ring-[hsl(258_70%_90%)] shadow-sm active:scale-[0.98] transition-transform text-left leading-tight"
        >
          <RotateCcw className="h-4 w-4 shrink-0" />
          <span className="flex flex-col text-left">
            <span>Voltei a fumar.</span>
            <span>Quero retornar à jornada de redução.</span>
          </span>
        </button>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm rounded-3xl border-0 bg-white shadow-[0_24px_60px_-20px_hsl(258_60%_40%/0.4)]">
          <DialogHeader className="text-left">
            <DialogTitle className="text-base font-bold">
              Percebeu que o hábito voltou?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Voltar para a jornada de redução pode ajudar você a recuperar o controle, enfraquecer os gatilhos e tornar a próxima tentativa de parar mais leve.
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