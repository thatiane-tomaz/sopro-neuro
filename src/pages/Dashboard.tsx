import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useDailyContent } from "@/hooks/useDailyContent";
import { useJourneyTracking } from "@/hooks/useJourneyTracking";
import { useOnboardingData } from "@/hooks/useOnboardingData";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import MediaPlayer from "@/components/MediaPlayer";
import WaveBackground from "@/components/home/WaveBackground";
import ProgressBrain from "@/components/home/ProgressBrain";
import BottomNav from "@/components/home/BottomNav";
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
    getCurrentDay,
    isDayCompleted,
    isDayTimeLocked,
    getDayCompletionTime,
    startTracking,
    updateProgress,
    isLoading: trackingLoading,
  } = useJourneyTracking();
  const { data: onboarding, refetch: refetchOnboarding } = useOnboardingData();
  const { loading: subLoading } = useSubscription();
  const { toast } = useToast();

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [savingDate, setSavingDate] = useState(false);
  const [showStartHere, setShowStartHere] = useState(false);
  const [startHereSeen, setStartHereSeen] = useState(true);

  useEffect(() => {
    if (!user) return;
    const key = `start_here_seen_${user.id}`;
    setStartHereSeen(!!localStorage.getItem(key));
  }, [user]);

  const handleCloseStartHere = () => {
    if (user) localStorage.setItem(`start_here_seen_${user.id}`, "1");
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

  const progressPct = Math.round((completedInPhase / 7) * 100);

  const dayLocked = isDayTimeLocked(currentDay) && !isAdmin;

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
  const vapesPerWeek = onboarding?.vapes_per_week || 0;
  // Convert vapes/week to cigarette-equivalents per day (round up)
  const equivCigsPerDay = cigsPerDay + Math.ceil(vapesPerWeek / 7);
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
    const interactionType = `${type === "video" ? "video" : "hipnose"}_dia_${currentDay}`;
    setSelectedMedia({
      title: dayContent?.title || `Dia ${currentDay}`,
      fileUrl: getMediaUrl(currentDay, type),
      contentType: type,
      day: currentDay,
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

  if (authLoading || profileLoading || adminLoading || contentLoading || trackingLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
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

      <div className="mx-auto max-w-md px-5 pt-[env(safe-area-inset-top)]">
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

        {/* Phase badge */}
        <div className="flex justify-center mt-6">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[hsl(258_80%_95%)] text-[hsl(258_60%_45%)]">
            {phaseNumber === 1 ? "Fase 1 • Preparação" : "Fase 2 • Libertação"}
          </span>
        </div>

        {/* Day title */}
        <div className="text-center mt-3">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[hsl(220_90%_55%)] to-[hsl(230_90%_45%)] bg-clip-text text-transparent">
            Dia {phaseDayIndex} <span className="text-base font-normal text-muted-foreground">de 7</span>
          </h1>
          {dayContent?.title && (
            <p className="text-sm font-semibold bg-gradient-to-r from-[hsl(220_90%_55%)] to-[hsl(230_90%_45%)] bg-clip-text text-transparent mt-1">
              {dayContent.title}
            </p>
          )}
        </div>

        {/* Brain progress */}
        <div className="mt-6">
          <ProgressBrain progress={progressPct} locked={dayLocked} />
          <div className="text-center -mt-1">
            <p className="text-3xl font-bold bg-gradient-to-r from-[hsl(220_90%_55%)] to-[hsl(230_90%_45%)] bg-clip-text text-transparent">
              {progressPct}<span className="text-lg">%</span>
            </p>
            {motivational && (
              <p className="text-sm text-muted-foreground mt-1">{motivational}</p>
            )}
          </div>
        </div>

        {/* Content cards */}
        <div className={`grid gap-3 mt-6 ${phaseNumber === 2 ? "grid-cols-1" : "grid-cols-2"}`}>
          {phaseNumber === 1 && (
            <button
              onClick={() => openMedia("video")}
              disabled={dayLocked}
            className={`relative rounded-2xl bg-white/85 backdrop-blur-sm p-4 text-center shadow-[0_10px_30px_-15px_hsl(258_70%_45%/0.35)] ring-1 ring-black/[0.03] transition-transform active:scale-95 ${
              dayLocked ? "opacity-50" : "hover:shadow-[0_14px_36px_-14px_hsl(258_70%_45%/0.45)]"
              }`}
            >
              <div className="mx-auto h-12 w-12 rounded-full bg-gradient-to-br from-[hsl(230_85%_60%)] to-[hsl(258_80%_65%)] flex items-center justify-center shadow-md">
                <Play className="h-5 w-5 text-white fill-white" />
              </div>
              <p className="mt-2 font-semibold text-sm text-foreground">Vídeo</p>
              <p className="text-xs text-muted-foreground">{dayContent?.video_minutes || 10} min</p>
              <p className="text-[11px] text-muted-foreground mt-1">Entenda e transforme sua mente.</p>
            </button>
          )}
          <button
            onClick={() => openMedia("hypnosis")}
            disabled={dayLocked}
            className={`relative rounded-2xl bg-white/85 backdrop-blur-sm p-4 text-center shadow-[0_10px_30px_-15px_hsl(258_70%_45%/0.35)] ring-1 ring-black/[0.03] transition-transform active:scale-95 ${
              dayLocked ? "opacity-50" : "hover:shadow-[0_14px_36px_-14px_hsl(258_70%_45%/0.45)]"
            }`}
          >
            <div className="mx-auto h-12 w-12 rounded-full bg-gradient-to-br from-[hsl(258_70%_60%)] to-[hsl(280_70%_65%)] flex items-center justify-center shadow-md">
              <Headphones className="h-5 w-5 text-white" />
            </div>
            <p className="mt-2 font-semibold text-sm text-foreground">Hipnose</p>
            <p className="text-xs text-muted-foreground">{dayContent?.hypnosis_minutes || 15} min</p>
            <p className="text-[11px] text-muted-foreground mt-1">Reprograme seu cérebro em profundidade.</p>
          </button>
        </div>

        {/* Unlock info */}
        <div className="mt-4 flex items-center justify-center gap-2 text-center">
          <Timer className="h-4 w-4 text-muted-foreground" />
          {dayLocked && lockCountdown ? (
            <p className="text-xs text-muted-foreground">
              Será liberado em <span className="font-semibold text-foreground">{lockCountdown}</span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Após concluir todo o conteúdo do dia,<br />o próximo será liberado em <span className="font-semibold">6h</span>.
            </p>
          )}
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
                  rows={[{ label: "total", value: phase2Stats.cigs.toLocaleString("pt-BR") }]}
                />
                <SavingsBlock
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Dinheiro que você economizou"
                  rows={[{ label: "total", value: formatBRL(phase2Stats.money) }]}
                />
              </div>
              {lastCigDate && (
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground bg-[hsl(258_80%_97%)] rounded-lg px-3 py-2">
                  <span>
                    O dia da sua mudança de vida foi{" "}
                    <strong className="text-foreground">{format(lastCigDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</strong>
                  </span>
                  <button
                    onClick={() => {
                      const v = window.prompt(
                        "Atualizar data do último cigarro (AAAA-MM-DD):",
                        lastCigDate.toISOString().slice(0, 10),
                      );
                      if (v && /^\d{4}-\d{2}-\d{2}$/.test(v)) saveLastCigDate(v);
                    }}
                    className="text-[hsl(258_60%_50%)] hover:underline flex items-center gap-1"
                  >
                    <Pencil className="h-3 w-3" />
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