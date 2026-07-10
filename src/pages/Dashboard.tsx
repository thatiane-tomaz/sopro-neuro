import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  Check,
  Ban,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import MediaPlayer from "@/components/MediaPlayer";
import WaveBackground from "@/components/home/WaveBackground";
import ProgressBrain from "@/components/home/ProgressBrain";
import BottomNav from "@/components/home/BottomNav";
import PageLoader from "@/components/home/PageLoader";
import StartHereStory from "@/components/StartHereStory";
import SmokingLogDialog from "@/components/SmokingLogDialog";
import MuralPreview from "@/components/mural/MuralPreview";
import AbstinenceExtras from "@/components/home/AbstinenceExtras";
import { useSmokingLogs, yesterdayStr } from "@/hooks/useSmokingLogs";
import { scheduleDailySmokingReminder } from "@/services/dailySmokingReminder";
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
  const queryClient = useQueryClient();

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
  const [smokingDialogOpen, setSmokingDialogOpen] = useState(false);
  const [ritualDialogOpen, setRitualDialogOpen] = useState(false);
  const [showQuitDatePicker, setShowQuitDatePicker] = useState(false);
  const [quitPickerDate, setQuitPickerDate] = useState<Date | undefined>(new Date());
  const [switchingJornada, setSwitchingJornada] = useState(false);

  const { logs: smokingLogs, isLoading: smokingLogsLoading, upsert: upsertSmokingLog } = useSmokingLogs();

  // Schedule the daily "how many yesterday?" local notification on native.
  useEffect(() => {
    if (!user) return;
    scheduleDailySmokingReminder();
  }, [user]);

  // Determine journey type (redução/abstinência) — latest historico wins,
  // then onboarding v2, then default to "reducao".
  const { data: jornadaType } = useQuery({
    queryKey: ["jornada-type", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [hist, onb] = await Promise.all([
        (supabase as any)
          .from("historico_jornada_usuario")
          .select("jornada")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        (supabase as any)
          .from("onboarding_responses_v2")
          .select("jornada_inicial")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      const raw =
        hist?.data?.jornada ?? onb?.data?.jornada_inicial ?? "reducao";
      return raw === "abstinencia" ? "abstinência" : "redução";
    },
  });

  // Prompt the user for yesterday's cigarette count once per session
  // (only if they haven't logged it yet). For users on the abstinência
  // journey, we auto-fill 0 silently — they can still edit it later on
  // the Progresso tab.
  useEffect(() => {
    if (!user || authLoading || smokingLogsLoading) return;
    const alreadyLogged = smokingLogs.some((l) => l.log_date === yesterdayStr());
    if (alreadyLogged) return;

    if (jornadaType === "abstinência") {
      upsertSmokingLog({ logDate: yesterdayStr(), count: 0 }).catch(() => {});
      return;
    }

    if (!jornadaType) return;

    const key = `smoking_prompt_shown_${user.id}_${yesterdayStr()}`;
    if (sessionStorage.getItem(key)) return;
    const t = setTimeout(() => {
      setSmokingDialogOpen(true);
      sessionStorage.setItem(key, "1");
    }, 1200);
    return () => clearTimeout(t);
  }, [user, authLoading, smokingLogsLoading, smokingLogs, jornadaType, upsertSmokingLog]);

  // Current "gatilho" / posição of the user. For now everyone starts at posição 1.
  const { data: gatilho } = useQuery({
    queryKey: ["gatilho-jornada", 1, jornadaType],
    enabled: !!jornadaType,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("habitos_jornada")
        .select("*")
        .eq("posicao", "1")
        .eq("tipo_usuario", jornadaType)
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
  const tituloGatilho: string = (gatilho as any)?.habito_titulo ?? "Sua jornada começa aqui";
  const explicacaoDesafio: string =
    (gatilho as any)?.explicacao_missao ||
    "Observe esse hábito nos próximos dias: em quais momentos ele aparece, o que você sente antes e o que muda depois. Anote mentalmente os padrões para conversarmos sobre sua experiência.";
  const hasVideo: boolean = (gatilho as any)?.video ?? true;
  const hasHipnose: boolean = (gatilho as any)?.hipnose ?? true;
  const hasMissao: boolean = (gatilho as any)?.missao ?? true;

  // Keep interaction keys unique per journey type so completions in "redução"
  // don't count as done in "abstinência" (and vice-versa).
  const journeyKey = jornadaType === "abstinência" ? "abst_" : "";
  const videoInteraction = `${journeyKey}video_semana_${posicao}`;
  const hipnoseInteraction = `${journeyKey}hipnose_semana_${posicao}`;
  const missaoInteraction = `${journeyKey}missao_semana_${posicao}`;
  const missaoStartInteraction = `${journeyKey}missao_iniciada_semana_${posicao}`;

  const isInteractionFinished = (type: string) =>
    !!trackingData?.some((t) => t.interaction_type === type && t.finished_at !== null);

  const weeklyVideoDone = isInteractionFinished(videoInteraction);
  const weeklyHipnoseDone = isInteractionFinished(hipnoseInteraction);
  const weeklyMissaoDone = isInteractionFinished(missaoInteraction);

  // Mission unlock: 3 days after user first opens the mission dialog.
  const missaoStartTrack = trackingData?.find(
    (t) => t.interaction_type === missaoStartInteraction
  );
  const missaoStartedAt = missaoStartTrack ? new Date(missaoStartTrack.started_at) : null;
  const MISSAO_LOCK_MS = 3 * 24 * 60 * 60 * 1000;
  const missaoUnlockAt = missaoStartedAt
    ? new Date(missaoStartedAt.getTime() + MISSAO_LOCK_MS)
    : null;
  const missaoLocked =
    !isAdmin && !!missaoUnlockAt && Date.now() < missaoUnlockAt.getTime();
  const missaoCountdown = useMemo(() => {
    if (!missaoLocked || !missaoUnlockAt) return null;
    const ms = missaoUnlockAt.getTime() - Date.now();
    if (ms <= 0) return null;
    const d = Math.floor(ms / 86_400_000);
    const h = Math.floor((ms % 86_400_000) / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    const s = Math.floor((ms % 60_000) / 1000);
    return `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  }, [tick, missaoLocked, missaoUnlockAt]);

  const openMissionDialog = async () => {
    setMissionDialogOpen(true);
    if (!missaoStartTrack) {
      try {
        await startTracking({ interactionType: missaoStartInteraction });
      } catch (e) {
        console.error("Erro ao iniciar missão:", e);
      }
    }
  };

  const openMissionChat = () => {
    navigate("/chat", {
      state: {
        mission: {
          habitoId: (gatilho as any)?.id,
          habitoTitulo: (gatilho as any).habito_titulo ?? tituloGatilho,
          explicacaoDesafio: explicacaoDesafio,
          objetivoChatMissao: (gatilho as any).objetivo_chat_missao ?? "",
          interactionType: missaoInteraction,
        },
      },
    });
  };

  const weeklyTotalCount =
    Number(hasVideo) + Number(hasHipnose) + Number(hasMissao);
  const weeklyCompletedCount =
    (hasVideo ? Number(weeklyVideoDone) : 0) +
    (hasHipnose ? Number(weeklyHipnoseDone) : 0) +
    (hasMissao ? Number(weeklyMissaoDone) : 0);
  const weeklyProgressPct = weeklyTotalCount > 0
    ? Math.round((weeklyCompletedCount / weeklyTotalCount) * 100)
    : 0;

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

  // Switch journey to "abstinência" (insert a new row on historico_jornada_usuario)
  const switchToAbstinencia = async () => {
    if (!user) return false;
    setSwitchingJornada(true);
    const { error } = await supabase
      .from("historico_jornada_usuario")
      .insert({ user_id: user.id, jornada: "abstinencia" } as any);
    setSwitchingJornada(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
    }
    await queryClient.invalidateQueries({ queryKey: ["jornada-type"] });
    await queryClient.invalidateQueries({ queryKey: ["gatilho-jornada"] });
    return true;
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

  const isAbstinencia = jornadaType === "abstinência";
  const showQuitCTA = !lastCigDate && !isAbstinencia;
  // Bloqueio: abstinência sem data do último cigarro precisa escolher antes de acessar a jornada.
  const abstinenciaBloqueada = isAbstinencia && !lastCigDate;

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

        {/* Bloqueio da jornada de abstinência até definir a data */}
        {abstinenciaBloqueada && (
          <Card className="mt-6 p-5 bg-white/95 backdrop-blur-md border-0 shadow-[0_20px_60px_-18px_hsl(258_70%_45%/0.35)] ring-1 ring-[hsl(258_70%_92%)] rounded-3xl">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[hsl(258_80%_95%)] to-[hsl(220_80%_95%)] text-[hsl(258_60%_50%)] flex items-center justify-center shadow-sm">
                <CalendarIcon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(258_80%_96%)] px-2 py-0.5 ring-1 ring-[hsl(258_70%_90%)]">
                  <Sparkles className="h-3 w-3 text-[hsl(258_65%_52%)]" />
                  <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-[hsl(258_60%_45%)]">
                    Ritual do último cigarro
                  </span>
                </div>
                <h3 className="mt-1.5 text-base font-bold text-[hsl(258_60%_35%)] leading-tight text-balance">
                  {showQuitDatePicker
                    ? "Quando foi seu último cigarro?"
                    : "Parabéns por dar esse passo!"}
                </h3>
              </div>
            </div>

            {!showQuitDatePicker ? (
              <>
                <p className="mt-3 text-[12px] text-muted-foreground leading-relaxed text-pretty">
                  Escolher parar de fumar é uma conquista enorme. Registre a data do seu último cigarro para marcar o início da sua nova fase.
                </p>
                <Button
                  className="mt-4 w-full rounded-xl bg-gradient-to-br from-[hsl(200_75%_48%)] to-[hsl(210_75%_55%)] text-primary-foreground shadow-md"
                  onClick={() => {
                    setQuitPickerDate(new Date());
                    setShowQuitDatePicker(true);
                  }}
                >
                  Informar data do último cigarro
                </Button>
              </>
            ) : (
              <>
                <div className="mt-4 flex justify-center pointer-events-auto">
                  <Calendar
                    mode="single"
                    selected={quitPickerDate}
                    onSelect={setQuitPickerDate}
                    locale={ptBR}
                    disabled={(d) => d > new Date()}
                    className="rounded-xl pointer-events-auto"
                  />
                </div>
                {quitPickerDate && (
                  <div className="mt-2 rounded-xl bg-[hsl(258_80%_97%)] px-3 py-2 text-center">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Selecionado</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">
                      {format(quitPickerDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => setShowQuitDatePicker(false)}
                    disabled={savingDate}
                  >
                    Voltar
                  </Button>
                  <Button
                    className="flex-1 rounded-xl bg-gradient-to-br from-[hsl(258_70%_55%)] to-[hsl(280_70%_60%)] text-white shadow-md"
                    disabled={!quitPickerDate || savingDate}
                    onClick={async () => {
                      if (!quitPickerDate) return;
                      const y = quitPickerDate.getFullYear();
                      const m = String(quitPickerDate.getMonth() + 1).padStart(2, "0");
                      const d = String(quitPickerDate.getDate()).padStart(2, "0");
                      await saveLastCigDate(`${y}-${m}-${d}`);
                      setShowQuitDatePicker(false);
                    }}
                  >
                    {savingDate ? "Salvando..." : "Confirmar"}
                  </Button>
                </div>
              </>
            )}

            <p className="mt-3 text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1">
              <Lock className="h-3 w-3" />
              Conteúdos serão liberados após informar a data.
            </p>
          </Card>
        )}

        {/* Comece aqui (first-time only) */}
        {!abstinenciaBloqueada && !startHereSeen && (
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

        <div
          className={
            abstinenciaBloqueada
              ? "pointer-events-none opacity-50 select-none"
              : ""
          }
          aria-hidden={abstinenciaBloqueada}
        >
        {/* Hábito em foco — hero */}
        <div className="text-center mt-6 px-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/70 backdrop-blur px-3 py-1 ring-1 ring-[hsl(258_70%_88%)] shadow-[0_6px_18px_-10px_hsl(258_70%_45%/0.35)]">
            <Sparkles className="h-3 w-3 text-[hsl(258_65%_52%)]" />
            <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[hsl(258_60%_45%)]">
              Hábito em foco
            </span>
          </div>
          <h1 className="mt-2.5 text-2xl font-bold bg-gradient-to-r from-[hsl(220_90%_55%)] to-[hsl(258_70%_55%)] bg-clip-text text-transparent leading-tight">
            {tituloGatilho}
          </h1>
        </div>

        {/* Brain progress */}
        <div className="mt-5">
          <ProgressBrain
            progress={progressPct}
            locked={dayLocked}
            onClick={() => navigate("/chat")}
            ariaLabel="Abrir chat com a IA"
          />
          {progressPct > 0 && (
            <div className="flex justify-center -mt-4 relative z-10">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-3 py-1 shadow-[0_4px_12px_-4px_hsl(258_70%_45%/0.3)] ring-1 ring-[hsl(258_70%_88%)]">
                <span className="text-xs font-bold text-[hsl(258_65%_52%)]">{progressPct}%</span>
                <span className="text-[10px] text-muted-foreground font-medium">completo</span>
              </div>
            </div>
          )}
        </div>

        {/* Weekly content cards (stacked) */}
        <div className="mt-6">
          <p className="text-sm font-bold text-foreground/80 mb-3 px-1">Continue sua jornada</p>
          <div className="flex flex-col gap-3">
          {hasVideo && (
          <WeeklyContentCard
            title="Vídeo"
            subtitle="Entenda e transforme sua mente."
            iconBg="from-[hsl(230_85%_60%)] to-[hsl(258_80%_65%)]"
            icon={<Play className="h-5 w-5 text-white fill-white" />}
            done={weeklyVideoDone}
            onClick={() => openMedia("video")}
          />
          )}
          {hasHipnose && (
          <WeeklyContentCard
            title="Hipnose"
            subtitle="Reprograme seu cérebro em profundidade."
            iconBg="from-[hsl(258_70%_60%)] to-[hsl(280_70%_65%)]"
            icon={<Headphones className="h-5 w-5 text-white" />}
            done={weeklyHipnoseDone}
            onClick={() => openMedia("hypnosis")}
          />
          )}
          {hasMissao && (
          <WeeklyContentCard
            title="Missão"
            subtitle="Coloque em prática o seu desafio da semana."
            iconBg="from-[hsl(280_75%_60%)] to-[hsl(320_70%_65%)]"
            icon={<Sparkles className="h-5 w-5 text-white" />}
            done={weeklyMissaoDone}
            onClick={openMissionDialog}
          />
          )}
        </div></div>

        {/* Extras da jornada de abstinência: SOS + gatilhos (a lista abaixo termina com "voltar para redução") */}
        {isAbstinencia && <AbstinenceExtras />}

        {/* Mural — experiências compartilhadas */}
        <MuralPreview />

        {/* Progress / savings card */}
        <Card className="mt-6 p-5 bg-white/90 backdrop-blur-md border-0 shadow-[0_18px_50px_-18px_hsl(230_60%_40%/0.22)] ring-1 ring-black/[0.03] rounded-3xl">
          <h3 className="font-semibold text-foreground text-base">Você está no caminho certo</h3>

          <button
            onClick={() => navigate("/progresso")}
            className="mt-4 w-full text-left rounded-2xl bg-gradient-to-br from-[hsl(258_80%_98%)] to-[hsl(220_80%_98%)] p-4 shadow-[0_6px_20px_-12px_hsl(258_70%_45%/0.25)] ring-1 ring-[hsl(258_70%_92%)] active:scale-[0.99] transition-transform flex items-center gap-3"
          >
            <div className="h-11 w-11 rounded-full bg-white flex items-center justify-center text-[hsl(258_60%_50%)] shadow-sm flex-shrink-0">
              <Cigarette className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground leading-tight whitespace-nowrap">
                Acompanhe sua evolução
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug whitespace-nowrap">
                Veja seu gráfico de consumo e economia.
              </p>
            </div>
            <div className="text-[hsl(258_60%_50%)] text-lg font-bold">→</div>
          </button>

          {phaseNumber !== 1 && lastCigDate && (
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

          {/* Benefits row */}
          <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-[hsl(220_30%_94%)]">
            <Benefit icon={<Zap className="h-5 w-5" />} label="Mais energia" />
            <Benefit icon={<Target className="h-5 w-5" />} label="Mais foco" />
            <Benefit icon={<Flower2 className="h-5 w-5" />} label="Mais calma" />
            <Benefit icon={<HeartPulse className="h-5 w-5" />} label="Mais saúde" />
          </div>
        </Card>
        {isAbstinencia && <AbstinenceExtras mode="return" />}
        {/* CTA — Decidir parar de fumar */}
        {showQuitCTA && !showQuitDatePicker && (
          <Card className="mt-6 p-5 bg-[hsl(45_80%_97%)] backdrop-blur-sm border-0 shadow-[0_14px_40px_-16px_hsl(258_70%_45%/0.25)] ring-1 ring-black/[0.04] rounded-2xl overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="text-base font-bold text-foreground leading-snug">
                Pronto para seu próximo passo?
              </h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Quando você se sentir pronto para viver completamente sem cigarro, estaremos aqui para te apoiar.
              </p>
              <button
                onClick={() => setRitualDialogOpen(true)}
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-full px-3 py-3 text-[11px] font-bold text-white shadow-[0_10px_28px_-10px_hsl(258_70%_40%/0.55)] active:scale-95 transition-transform text-center leading-tight whitespace-nowrap"
                style={{
                  background: "linear-gradient(135deg, hsl(258, 70%, 55%), hsl(280, 65%, 55%))",
                }}
              >
                <span className="relative inline-flex items-center justify-center shrink-0">
                  <Cigarette className="h-5 w-5" />
                  <Ban className="h-5 w-5 absolute text-white/90" strokeWidth={2.5} />
                </span>
                Estou pronto para meu último cigarro
              </button>
            </div>
          </Card>
        )}

        {/* Inline date picker (fallback — usado apenas para redução) */}
        {showQuitDatePicker && !lastCigDate && !isAbstinencia && (
          <Card className="mt-6 p-5 bg-white/90 backdrop-blur-md border-0 shadow-[0_18px_50px_-18px_hsl(258_70%_45%/0.3)] ring-1 ring-[hsl(258_70%_92%)] rounded-3xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-[hsl(258_80%_95%)] text-[hsl(258_60%_50%)] flex items-center justify-center shadow-sm">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-foreground leading-tight">
                  Quando foi seu último cigarro?
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  Escolha o dia para começarmos sua nova jornada.
                </p>
              </div>
            </div>
            <div className="mt-3 flex justify-center">
              <Calendar
                mode="single"
                selected={quitPickerDate}
                onSelect={setQuitPickerDate}
                locale={ptBR}
                disabled={(d) => d > new Date()}
                className="rounded-xl"
              />
            </div>
            {quitPickerDate && (
              <div className="mt-2 rounded-xl bg-[hsl(258_80%_97%)] px-3 py-2 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Selecionado</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  {format(quitPickerDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setShowQuitDatePicker(false)}
                disabled={savingDate}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 rounded-xl bg-gradient-to-br from-[hsl(258_70%_55%)] to-[hsl(280_70%_60%)] text-white shadow-md"
                disabled={!quitPickerDate || savingDate}
                onClick={async () => {
                  if (!quitPickerDate) return;
                  const y = quitPickerDate.getFullYear();
                  const m = String(quitPickerDate.getMonth() + 1).padStart(2, "0");
                  const d = String(quitPickerDate.getDate()).padStart(2, "0");
                  await saveLastCigDate(`${y}-${m}-${d}`);
                  setShowQuitDatePicker(false);
                }}
              >
                {savingDate ? "Salvando..." : "Confirmar data"}
              </Button>
            </div>
          </Card>
        )}
        </div>
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

      <SmokingLogDialog
        open={smokingDialogOpen}
        onOpenChange={setSmokingDialogOpen}
      />

      {/* Ritual do último cigarro */}
      <Dialog open={ritualDialogOpen} onOpenChange={setRitualDialogOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-0 overflow-hidden border-0 bg-white shadow-[0_24px_60px_-20px_hsl(258_60%_40%/0.4)]">
          <div className="bg-gradient-to-br from-[hsl(258_80%_97%)] to-[hsl(220_80%_97%)] px-5 pt-6 pb-5 text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-white text-[hsl(258_60%_50%)] flex items-center justify-center shadow-sm">
              <span className="relative inline-flex items-center justify-center">
                <Cigarette className="h-6 w-6" />
                <Ban className="h-6 w-6 absolute text-[hsl(258_60%_50%)]" strokeWidth={2.5} />
              </span>
            </div>
            <DialogHeader className="mt-4 space-y-1 text-center">
              <DialogTitle className="text-lg font-bold text-foreground text-center text-balance">
                O ritual do último cigarro
              </DialogTitle>
              <DialogDescription className="text-[12px] text-muted-foreground text-center text-balance px-2">
                Um gesto simbólico que marca uma virada real na sua mente.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-5 pt-4 pb-2 space-y-3">
            <div className="rounded-2xl bg-[hsl(258_80%_97%)] px-4 py-3.5 ring-1 ring-[hsl(258_70%_92%)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[hsl(258_60%_45%)]">
                Faça o ritual
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-foreground/85">
                Escolha um lugar tranquilo, respire fundo e viva conscientemente esse último cigarro.
                Repare no cheiro, no gosto, no que você sente. Depois, diga em voz alta:
                <span className="font-semibold text-foreground"> “esse é o meu último”</span>.
                Esse gesto simples reforça a mudança e ajuda seu cérebro a fechar esse ciclo.
              </p>
            </div>
            <div className="rounded-2xl bg-[hsl(220_80%_97%)] px-4 py-3.5 ring-1 ring-[hsl(220_70%_92%)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[hsl(220_60%_45%)]">
                Sua jornada vai mudar
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-foreground/85">
                A partir dessa data, o app vai focar em te ajudar nos primeiros dias de abstinência,
                com conteúdos, hábitos e missões pensados para atravessar as fissuras e sustentar sua nova identidade.
              </p>
            </div>
          </div>
          <DialogFooter className="px-5 pb-5 pt-3 flex-col gap-2 sm:flex-col sm:gap-2">
            <Button
              className="w-full rounded-xl h-auto py-3 whitespace-nowrap text-[13px] leading-none bg-gradient-to-br from-[hsl(258_70%_55%)] to-[hsl(280_70%_60%)] text-white shadow-md"
              disabled={switchingJornada}
              onClick={async () => {
                const ok = await switchToAbstinencia();
                if (!ok) return;
                setRitualDialogOpen(false);
                setQuitPickerDate(new Date());
                setShowQuitDatePicker(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              🎉 Já fumei meu último cigarro
            </Button>
            <Button
              className="w-full rounded-xl h-auto py-3 whitespace-nowrap text-[13px] leading-none bg-gradient-to-br from-[hsl(200_75%_48%)] to-[hsl(210_75%_55%)] text-primary-foreground shadow-md hover:opacity-95"
              disabled={switchingJornada}
              onClick={async () => {
                const ok = await switchToAbstinencia();
                if (!ok) return;
                setRitualDialogOpen(false);
                setShowQuitDatePicker(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              🗓️ Vou fazer o ritual em breve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {missionDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-[hsl(258_40%_10%/0.55)] px-3 pb-[max(env(safe-area-inset-bottom),16px)] pt-4 backdrop-blur-sm sm:items-center sm:pt-8">
          <div className="relative my-auto w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-[0_24px_70px_-22px_hsl(258_70%_35%/0.55)] animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-6 duration-200">
            <button
              onClick={() => setMissionDialogOpen(false)}
              aria-label="Fechar"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-foreground/70 shadow-sm ring-1 ring-black/[0.05] transition hover:text-foreground active:scale-95"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="bg-gradient-to-br from-[hsl(258_80%_97%)] to-[hsl(220_85%_97%)] px-6 pb-7 pt-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[hsl(258_65%_52%)] shadow-sm ring-1 ring-black/[0.03]">
                <Sparkles className="h-8 w-8" />
              </div>
              <p className="mt-5 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[hsl(258_50%_55%)]">
                Sua missão
              </p>
              <h2 className="mt-2 text-center text-2xl font-bold leading-tight text-foreground">
                {tituloGatilho}
              </h2>
            </div>

            <div className="px-6 py-6">
              <div className="rounded-2xl bg-[hsl(258_80%_97%)] px-5 py-5 ring-1 ring-[hsl(258_70%_92%)]">
                <p className="text-[15px] leading-[1.65] text-foreground/85 whitespace-pre-line">
                  {explicacaoDesafio}
                </p>
              </div>

              <div className="mt-6 space-y-2.5">
                <button
                  onClick={() => setMissionDialogOpen(false)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-sm font-semibold text-[hsl(258_60%_42%)] ring-1 ring-[hsl(258_70%_88%)] shadow-sm active:scale-[0.98] transition-transform"
                >
                  Ainda vou viver essa missão
                </button>
                <button
                  onClick={openMissionChat}
                  disabled={missaoLocked || weeklyMissaoDone}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[hsl(220_90%_55%)] to-[hsl(258_70%_55%)] px-4 py-3.5 text-sm font-bold text-white shadow-[0_12px_28px_-12px_hsl(258_70%_40%/0.7)] active:scale-[0.98] transition-transform disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
                >
                  {missaoLocked ? (
                    <>
                      <Lock className="h-4 w-4" />
                      Disponível em {missaoCountdown}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Concluir a missão
                    </>
                  )}
                </button>
              </div>
              {missaoLocked && (
                <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
                  Viva sua missão por 3 dias. Depois desse período, você poderá conversar com o chat sobre a experiência.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

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

function WeeklyContentCard({
  title,
  subtitle,
  icon,
  iconBg,
  done,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  done: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative w-full rounded-2xl bg-white/85 backdrop-blur-sm p-4 text-left shadow-[0_10px_30px_-15px_hsl(258_70%_45%/0.35)] ring-1 ring-black/[0.03] transition-transform active:scale-[0.98] hover:shadow-[0_14px_36px_-14px_hsl(258_70%_45%/0.45)] flex items-center gap-3"
    >
      <div className="relative flex-shrink-0">
        <div
          className={`h-12 w-12 rounded-full bg-gradient-to-br ${iconBg} flex items-center justify-center shadow-md ${
            done ? "opacity-40" : ""
          }`}
        >
          <div className={done ? "opacity-50" : ""}>{icon}</div>
        </div>
        {done && (
          <div className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-[hsl(258_70%_55%)] border-2 border-white flex items-center justify-center shadow-sm">
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground">{title}</p>
        <p className="text-[11px] text-muted-foreground leading-snug">{subtitle}</p>
      </div>
    </button>
  );
}