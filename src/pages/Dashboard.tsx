import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useDailyContent } from "@/hooks/useDailyContent";
import { useJourneyTracking } from "@/hooks/useJourneyTracking";
import { useOnboardingData } from "@/hooks/useOnboardingData";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsFreelist } from "@/hooks/useIsFreelist";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar as CalendarIcon,
  Headphones,
  Play,
  Timer,
  Cigarette,
  DollarSign,
  Zap,
  Target,
  Flower2,
  HeartPulse,
  User,
  LogOut,
  HelpCircle,
  Pencil,
  Lock,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import MediaPlayer from "@/components/MediaPlayer";
import WaveBackground from "@/components/home/WaveBackground";
import ProgressBrain from "@/components/home/ProgressBrain";
import BottomNav from "@/components/home/BottomNav";
import PageLoader from "@/components/home/PageLoader";
import StartHereStory from "@/components/StartHereStory";
import soproLogo from "@/assets/sopro-logo.png";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
};

const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { data: dailyContent, isLoading: contentLoading } = useDailyContent();
  const {
    trackingData,
    getCurrentDay,
    isDayCompleted,
    isDayTimeLocked,
    getDayCompletionTime,
    startTracking,
    updateProgress,
    isLoading: trackingLoading,
  } = useJourneyTracking();
  const { data: onboarding, refetch: refetchOnboarding } = useOnboardingData();
  const { loading: subLoading, isPremium, isExpired } = useSubscription();
  const { isFreelist, loading: freelistLoading } = useIsFreelist();
  const { toast } = useToast();

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [savingDate, setSavingDate] = useState(false);
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [pendingDate, setPendingDate] = useState<Date | undefined>(undefined);
  const [showStartHere, setShowStartHere] = useState(false);
  const [startHereSeen, setStartHereSeen] = useState(true);
  const [missionDialogOpen, setMissionDialogOpen] = useState(false);
  const [savingMission, setSavingMission] = useState(false);

  // Current "gatilho" / posição of the user. For now everyone starts at posição 1.
  const { data: gatilho } = useQuery({
    queryKey: ["gatilho-jornada", 1],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gatilhos_jornada")
        .select("*")
        .eq("posicao", 1)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error("Erro ao buscar gatilho:", error);
        return null;
      }
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const posicao = (gatilho as any)?.posicao ?? 1;
  const tituloGatilho: string = (gatilho as any)?.titulo_gatilho ?? "Sua jornada começa aqui";
  const explicacaoDesafio: string = (gatilho as any)?.explicacao_desafio ?? "";

  const videoInteraction = `video_semana_${posicao}`;
  const hipnoseInteraction = `hipnose_semana_${posicao}`;
  const missaoInteraction = `missao_semana_${posicao}`;

  const isInteractionFinished = (type: string) =>
    !!trackingData?.some((t) => t.interaction_type === type && t.finished_at !== null);

  const weeklyVideoDone = isInteractionFinished(videoInteraction);
  const weeklyHipnoseDone = isInteractionFinished(hipnoseInteraction);
  const weeklyMissaoDone = isInteractionFinished(missaoInteraction);
  const weeklyCompletedCount =
    Number(weeklyVideoDone) + Number(weeklyHipnoseDone) + Number(weeklyMissaoDone);
  const weeklyProgressPct = Math.round((weeklyCompletedCount / 3) * 100);

  useEffect(() => {
    if (!user) return;
    const key = `start_here_seen_${user.id}`;
    // Optimistic local check (legacy)
    if (localStorage.getItem(key)) {
      setStartHereSeen(true);
    }
    // Source of truth: profiles.start_here_seen
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("start_here_seen")
        .eq("user_id", user.id)
        .maybeSingle();
      if ((data as any)?.start_here_seen) {
        setStartHereSeen(true);
        localStorage.setItem(key, "1");
      } else {
        // If user already has any journey progress, treat as existing user and auto-mark as seen
        const { count } = await supabase
          .from("journey_tracking")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);
        if ((count ?? 0) > 0) {
          setStartHereSeen(true);
          localStorage.setItem(key, "1");
          supabase.rpc("mark_start_here_seen").then(({ error }) => {
            if (error) console.error("mark_start_here_seen error:", error);
          });
        } else {
          setStartHereSeen(false);
        }
      }
    })();
  }, [user]);

  const handleCloseStartHere = () => {
    if (user) {
      localStorage.setItem(`start_here_seen_${user.id}`, "1");
      supabase.rpc("mark_start_here_seen").then(({ error }) => {
        if (error) console.error("mark_start_here_seen error:", error);
      });
    }
    setShowStartHere(false);
    setStartHereSeen(true);
  };

  const currentDay = getCurrentDay();
  const phaseNumber = currentDay <= 7 ? 1 : 2;
  const phaseStart = phaseNumber === 1 ? 1 : 8;
  const phaseEnd = phaseNumber === 1 ? 7 : 14;
  const phaseDayIndex = currentDay - phaseStart + 1; // "Dia X de 7"

  // Days completed within current phase (excluding current)
  const completedInPhase = useMemo(() => {
    let n = 0;
    for (let d = phaseStart; d <= phaseEnd; d++) if (isDayCompleted(d)) n++;
    return n;
  }, [tick, phaseStart, phaseEnd, isDayCompleted]);

  const progressPct = weeklyProgressPct;

  const dayLocked = isDayTimeLocked(currentDay) && !isAdmin;

  // Trigger paywall once Day 1 is completed and user has no access
  useEffect(() => {
    if (adminLoading || subLoading || trackingLoading || freelistLoading) return;
    if (isAdmin || isPremium || isExpired || isFreelist) return;
    if (isDayCompleted(1)) {
      navigate("/paywall");
    }
  }, [
    adminLoading,
    subLoading,
    trackingLoading,
    freelistLoading,
    isAdmin,
    isPremium,
    isExpired,
    isFreelist,
    isDayCompleted,
    navigate,
  ]);

  const dayContent = dailyContent?.find((d) => d.day_number === currentDay);
  const firstName = (profile?.display_name || "").split(" ")[0] || "";

  // Countdown until current day unlocks (when locked)
  const lockCountdown = useMemo(() => {
    if (!dayLocked || currentDay <= 1) return null;
    const prev = getDayCompletionTime(currentDay - 1);
    if (!prev) return null;
    const unlock = new Date(prev.getTime() + 6 * 60 * 60 * 1000);
    const ms = unlock.getTime() - Date.now();
    if (ms <= 0) return null;
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    const s = Math.floor((ms % 60_000) / 1000);
    return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  }, [tick, dayLocked, currentDay]);

  // ----- Savings calculations -----
  const cigsPerDay = onboarding?.cigarettes_per_day || 0;
  const vapesPerMonth = onboarding?.vapes_per_month || 0;
  // Convert vapes/month to cigarette-equivalents per day (round up)
  const equivCigsPerDay = cigsPerDay + Math.ceil(vapesPerMonth / 30);
  const weeklyCostNum = (() => {
    const v = onboarding?.weekly_cost_value;
    if (typeof v === "number" && isFinite(v) && v > 0) return v;
    const txt = onboarding?.weekly_cost;
    if (!txt) return 0;
    const parsed = parseFloat(String(txt).replace(",", "."));
    return isFinite(parsed) && parsed > 0 ? parsed : 0;
  })();

  const phase1Stats = useMemo(() => ({
    cigsMonth: equivCigsPerDay * 30,
    cigsYear: equivCigsPerDay * 365,
    moneyMonth: weeklyCostNum * 4,
    moneyYear: weeklyCostNum * 52,
  }), [equivCigsPerDay, weeklyCostNum]);

  const lastCigDateStr = onboarding?.last_cigarette_date as string | undefined;
  const lastCigDate = lastCigDateStr ? new Date(lastCigDateStr + "T00:00:00") : null;
  const daysSinceQuit = lastCigDate
    ? Math.max(0, Math.floor((Date.now() - lastCigDate.getTime()) / 86_400_000))
    : 0;

  const phase2Stats = useMemo(() => {
    if (!lastCigDate) return { cigs: 0, money: 0 };
    return {
      cigs: equivCigsPerDay * daysSinceQuit,
      money: (weeklyCostNum / 7) * daysSinceQuit,
    };
  }, [lastCigDate, daysSinceQuit, equivCigsPerDay, weeklyCostNum]);

  // ----- Media handler -----
  const getMediaUrl = (day: number, type: "video" | "hypnosis") => {
    const bucket = type === "video" ? "videos" : "hypnosis";
    const ext = type === "video" ? "mp4" : day >= 8 ? "MP3" : "mp3";
    const file = type === "video" ? `video_${day}.${ext}` : `hipnose_${day}.${ext}`;
    return `https://kpewsvpufzkyejchncta.supabase.co/storage/v1/object/public/${bucket}/${file}`;
  };

  const openMedia = async (type: "video" | "hypnosis") => {
    if (dayLocked) return;
    // Day 2+ requires active subscription (admins bypass)
    if (!isAdmin && !isFreelist && currentDay >= 2 && !isPremium) {
      navigate("/paywall");
      return;
    }
    const interactionType = type === "video" ? videoInteraction : hipnoseInteraction;
    setSelectedMedia({
      title: tituloGatilho,
      fileUrl: getMediaUrl(posicao, type),
      contentType: type,
      day: posicao,
      interactionType,
    });
    try {
      const r = await startTracking({ interactionType });
      if (r?.id) setTrackingId(r.id);
    } catch (e) {
      console.error(e);
    }
  };

  const completeMission = async () => {
    if (savingMission) return;
    setSavingMission(true);
    try {
      const r = await startTracking({ interactionType: missaoInteraction });
      if (r?.id) {
        updateProgress({ trackingId: r.id, progressPercentage: 100, finished: true });
      }
      toast({ title: "Missão concluída!" });
      setMissionDialogOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingMission(false);
    }
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

  // ----- Save last cigarette date -----
  const saveLastCigDate = async (dateStr: string) => {
    if (!user || !onboarding) return;
    setSavingDate(true);
    const { error } = await supabase
      .from("onboarding_responses")
      .update({ last_cigarette_date: dateStr })
      .eq("user_id", user.id);
    setSavingDate(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Data salva!" });
    refetchOnboarding();
  };

  if (authLoading || profileLoading || adminLoading || contentLoading || trackingLoading || subLoading) {
    return <PageLoader />;
  }
  if (!user) return <Navigate to="/login" replace />;

  const motivational = (() => {
    if (phaseNumber === 1) {
      const remaining = Math.max(0, 7 - phaseDayIndex);
      return `Faltam ${remaining} dias para a sua liberdade`;
    }
    if (lastCigDate) return `Você está livre da nicotina há ${daysSinceQuit} dias`;
    return null;
  })();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const showLastCigCard = phaseNumber === 2 && !lastCigDate;

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-32">
      <WaveBackground />

      <div className="mx-auto max-w-md animate-page-in px-5 pt-[env(safe-area-inset-top)]">
        {/* Header */}
        <header className="flex items-center justify-between pt-4">
          <img src={soproLogo} alt="Sopro Neuro" className="h-10 w-auto" />
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground leading-tight">
                {getGreeting()}{firstName ? `, ${firstName}!` : "!"}
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Seu cérebro está aprendendo<br />uma nova forma de viver.
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-10 w-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-[0_4px_14px_-4px_hsl(220_40%_40%/0.18)] ring-1 ring-black/[0.03]">
                  <User className="h-5 w-5 text-primary" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <User className="h-4 w-4 mr-2" /> Conta
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/faq")}>
                  <HelpCircle className="h-4 w-4 mr-2" /> Ajuda
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Comece aqui (first-time only) */}
        {!startHereSeen && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => {
                setShowStartHere(true);
                if (user) {
                  localStorage.setItem(`start_here_seen_${user.id}`, "1");
                  supabase.rpc("mark_start_here_seen").then(({ error }) => {
                    if (error) console.error("mark_start_here_seen error:", error);
                  });
                  setStartHereSeen(true);
                }
              }}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_28px_-10px_hsl(230_70%_40%/0.55)] active:scale-95 transition-transform"
              style={{
                background:
                  "linear-gradient(135deg, hsl(220, 90%, 55%), hsl(258, 70%, 55%))",
              }}
            >
              ✨ Comece aqui
            </button>
          </div>
        )}

        {/* Gatilho title above brain */}
        <div className="text-center mt-6 px-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[hsl(220_90%_55%)] to-[hsl(258_70%_55%)] bg-clip-text text-transparent leading-tight">
            {tituloGatilho}
          </h1>
        </div>

        {/* Brain progress */}
        <div className="mt-6">
          <ProgressBrain
            progress={progressPct}
            locked={dayLocked}
            onClick={() => navigate("/chat")}
            ariaLabel="Abrir chat com a IA"
          />
          <div className="text-center -mt-1">
            <p className="text-3xl font-bold bg-gradient-to-r from-[hsl(220_90%_55%)] to-[hsl(230_90%_45%)] bg-clip-text text-transparent">
              {progressPct}<span className="text-lg">%</span>
            </p>
          </div>
        </div>

        {/* Weekly content cards (stacked) */}
        <div className="flex flex-col gap-3 mt-6">
          <WeeklyContentCard
            title="Vídeo"
            subtitle="Entenda e transforme sua mente."
            iconBg="from-[hsl(230_85%_60%)] to-[hsl(258_80%_65%)]"
            icon={<Play className="h-5 w-5 text-white fill-white" />}
            done={weeklyVideoDone}
            onClick={() => openMedia("video")}
          />
          <WeeklyContentCard
            title="Hipnose"
            subtitle="Reprograme seu cérebro em profundidade."
            iconBg="from-[hsl(258_70%_60%)] to-[hsl(280_70%_65%)]"
            icon={<Headphones className="h-5 w-5 text-white" />}
            done={weeklyHipnoseDone}
            onClick={() => openMedia("hypnosis")}
          />
          <WeeklyContentCard
            title="Missão"
            subtitle="Coloque em prática o seu desafio da semana."
            iconBg="from-[hsl(280_75%_60%)] to-[hsl(320_70%_65%)]"
            icon={<Sparkles className="h-5 w-5 text-white" />}
            done={weeklyMissaoDone}
            onClick={() => setMissionDialogOpen(true)}
          />
        </div>

        {/* Last cigarette date card (Phase 2, no date yet) */}
        {showLastCigCard && (
          <Card className="mt-6 p-5 bg-white/85 backdrop-blur-sm border-0 shadow-[0_14px_40px_-16px_hsl(258_70%_45%/0.3)] ring-1 ring-black/[0.03] rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-[hsl(258_80%_95%)] flex items-center justify-center flex-shrink-0">
                <CalendarIcon className="h-5 w-5 text-[hsl(258_60%_50%)]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Qual foi a data do seu último cigarro?</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Essa informação é <span className="text-[hsl(258_60%_50%)] font-medium">essencial</span> para acompanhar sua evolução e <span className="text-[hsl(258_60%_50%)] font-medium">celebrar cada conquista</span>.
                </p>
                <input
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => e.target.value && saveLastCigDate(e.target.value)}
                  disabled={savingDate}
                  className="mt-3 w-full rounded-xl bg-white px-3 py-2.5 text-sm shadow-[inset_0_0_0_1px_hsl(258_70%_92%)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_70%_70%)]"
                />
                <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Você poderá editar a data depois, se necessário.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Progress / savings card */}
        <Card className="mt-6 p-5 bg-white/90 backdrop-blur-md border-0 shadow-[0_18px_50px_-18px_hsl(230_60%_40%/0.22)] ring-1 ring-black/[0.03] rounded-3xl">
          <h3 className="font-semibold text-foreground text-base">Você está no caminho certo</h3>

          {phaseNumber === 1 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <SavingsBlock
                icon={<Cigarette className="h-4 w-4" />}
                label="Cigarros que deixará de fumar"
                rows={[
                  { label: "por mês", value: phase1Stats.cigsMonth.toLocaleString("pt-BR") },
                  { label: "por ano", value: phase1Stats.cigsYear.toLocaleString("pt-BR") },
                ]}
              />
              <SavingsBlock
                icon={<DollarSign className="h-4 w-4" />}
                label="Dinheiro que irá economizar"
                rows={[
                  { label: "por mês", value: formatBRL(phase1Stats.moneyMonth) },
                  { label: "por ano", value: formatBRL(phase1Stats.moneyYear) },
                ]}
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <SavingsBlock
                  icon={<Cigarette className="h-4 w-4" />}
                  label="Cigarros que você evitou"
                  rows={[{ label: "", value: phase2Stats.cigs.toLocaleString("pt-BR") }]}
                />
                <SavingsBlock
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Dinheiro que você economizou"
                  rows={[{ label: "", value: formatBRL(phase2Stats.money) }]}
                />
              </div>
              {lastCigDate && (
                <div className="mt-4 flex items-start justify-between gap-3 text-xs bg-[hsl(258_80%_97%)] rounded-lg px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-muted-foreground">O dia da sua mudança de vida foi</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {format(lastCigDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setPendingDate(lastCigDate);
                      setDateDialogOpen(true);
                    }}
                    className="flex-shrink-0 h-8 w-8 rounded-full bg-white text-[hsl(258_60%_50%)] flex items-center justify-center shadow-sm ring-1 ring-black/[0.03] active:scale-95 transition-transform"
                    aria-label="Editar data"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* Benefits row */}
          <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-[hsl(220_30%_94%)]">
            <Benefit icon={<Zap className="h-5 w-5" />} label="Mais energia" />
            <Benefit icon={<Target className="h-5 w-5" />} label="Mais foco" />
            <Benefit icon={<Flower2 className="h-5 w-5" />} label="Mais calma" />
            <Benefit icon={<HeartPulse className="h-5 w-5" />} label="Mais saúde" />
          </div>
        </Card>
      </div>

      <BottomNav />

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

      {showStartHere && <StartHereStory onClose={handleCloseStartHere} />}

      <Dialog open={missionDialogOpen} onOpenChange={setMissionDialogOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-0 overflow-hidden border-0 bg-white shadow-[0_24px_60px_-20px_hsl(258_60%_40%/0.4)]">
          <div className="bg-gradient-to-br from-[hsl(280_80%_97%)] to-[hsl(220_80%_97%)] px-5 pt-5 pb-4">
            <DialogHeader className="text-left space-y-1">
              <div className="h-10 w-10 rounded-2xl bg-white text-[hsl(280_60%_50%)] flex items-center justify-center shadow-sm mb-2">
                <Sparkles className="h-5 w-5" />
              </div>
              <DialogTitle className="text-base font-bold text-foreground">
                Missão da semana
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {tituloGatilho}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
              {explicacaoDesafio || "Em breve você receberá o desafio da sua semana."}
            </p>
          </div>
          <DialogFooter className="px-5 pb-5 pt-1 flex-row gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setMissionDialogOpen(false)}
            >
              Fechar
            </Button>
            <Button
              className="flex-1 rounded-xl bg-gradient-to-br from-[hsl(280_70%_55%)] to-[hsl(320_70%_60%)] text-white shadow-md"
              disabled={savingMission || weeklyMissaoDone}
              onClick={completeMission}
            >
              {weeklyMissaoDone ? "Concluída" : savingMission ? "Salvando..." : "Concluir missão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dateDialogOpen} onOpenChange={setDateDialogOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-0 overflow-hidden border-0 bg-white shadow-[0_24px_60px_-20px_hsl(258_60%_40%/0.4)]">
          <div className="bg-gradient-to-br from-[hsl(258_80%_97%)] to-[hsl(220_80%_97%)] px-5 pt-5 pb-4">
            <DialogHeader className="text-left space-y-1">
              <div className="h-10 w-10 rounded-2xl bg-white text-[hsl(258_60%_50%)] flex items-center justify-center shadow-sm mb-2">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <DialogTitle className="text-base font-bold text-foreground">
                Sua data de mudança
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Selecione o dia em que você fumou pela última vez.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-3 py-3 flex justify-center">
            <Calendar
              mode="single"
              selected={pendingDate}
              onSelect={setPendingDate}
              locale={ptBR}
              disabled={(d) => d > new Date()}
              initialFocus
              className="rounded-xl"
            />
          </div>
          {pendingDate && (
            <div className="mx-5 mb-3 rounded-xl bg-[hsl(258_80%_97%)] px-3 py-2 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Selecionado</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {format(pendingDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          )}
          <DialogFooter className="px-5 pb-5 pt-1 flex-row gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setDateDialogOpen(false)}
              disabled={savingDate}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 rounded-xl bg-gradient-to-br from-[hsl(258_70%_55%)] to-[hsl(280_70%_60%)] text-white shadow-md"
              disabled={!pendingDate || savingDate}
              onClick={async () => {
                if (!pendingDate) return;
                const y = pendingDate.getFullYear();
                const m = String(pendingDate.getMonth() + 1).padStart(2, "0");
                const d = String(pendingDate.getDate()).padStart(2, "0");
                await saveLastCigDate(`${y}-${m}-${d}`);
                setDateDialogOpen(false);
              }}
            >
              {savingDate ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SavingsBlock({
  icon,
  label,
  rows,
}: {
  icon: React.ReactNode;
  label: string;
  rows: { label: string; value: string }[];
}) {
  const isSingle = rows.length === 1;
  return (
    <div className="rounded-2xl bg-gradient-to-br from-[hsl(258_80%_98%)] to-[hsl(220_80%_98%)] p-3.5 shadow-[0_6px_20px_-12px_hsl(258_70%_45%/0.25)] ring-1 ring-black/[0.03]">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-white text-[hsl(258_60%_50%)] flex items-center justify-center flex-shrink-0 shadow-sm">
          {icon}
        </div>
        <p className="text-xs font-medium text-foreground leading-tight">{label}</p>
      </div>
      <div className={`mt-3 grid ${isSingle ? "grid-cols-1" : "grid-cols-2"} gap-2`}>
        {rows.map((r, i) => (
          <div
            key={i}
            className="rounded-xl bg-white px-3 py-2 shadow-[0_2px_8px_-4px_hsl(258_60%_40%/0.12)]"
          >
            {r.label && (
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                {r.label}
              </p>
            )}
            <p
              className={`font-bold text-[hsl(258_60%_45%)] tabular-nums ${
                isSingle ? "text-2xl" : "text-base"
              }`}
            >
              {r.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Benefit({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <div className="h-10 w-10 rounded-xl bg-[hsl(258_80%_96%)] text-[hsl(258_60%_50%)] flex items-center justify-center">
        {icon}
      </div>
      <span className="text-[10px] font-medium text-foreground/80 leading-tight whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}