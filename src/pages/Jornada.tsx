import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useDailyContent } from "@/hooks/useDailyContent";
import { useJourneyTracking } from "@/hooks/useJourneyTracking";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Play,
  Headphones,
  Lock,
  Check,
  Sparkles,
  User,
  LogOut,
  HelpCircle,
  Brain,
  ShieldCheck,
} from "lucide-react";
import MediaPlayer from "@/components/MediaPlayer";
import WaveBackground from "@/components/home/WaveBackground";
import BottomNav from "@/components/home/BottomNav";
import soproLogo from "@/assets/sopro-logo.png";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
};

type DayStatus = "completed" | "current" | "locked";

export default function Jornada() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, hasAccessToDay } = useUserProfile();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { data: dailyContent, isLoading: contentLoading } = useDailyContent();
  const { isPremium, isExpired, loading: subLoading } = useSubscription();
  const {
    getCurrentDay,
    isDayCompleted,
    isDayTimeLocked,
    startTracking,
    updateProgress,
    isLoading: trackingLoading,
  } = useJourneyTracking();

  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);

  const currentDay = getCurrentDay();
  const firstName = (profile?.display_name || "").split(" ")[0] || "";

  const phase1Days = useMemo(
    () =>
      (dailyContent || [])
        .filter((d) => d.day_number >= 1 && d.day_number <= 7)
        .sort((a, b) => a.day_number - b.day_number),
    [dailyContent],
  );
  const phase2Days = useMemo(
    () =>
      (dailyContent || [])
        .filter((d) => d.day_number >= 8 && d.day_number <= 14)
        .sort((a, b) => a.day_number - b.day_number),
    [dailyContent],
  );

  const getStatus = (day: number): DayStatus => {
    if (isDayCompleted(day)) return "completed";
    if (day < currentDay) return "completed";
    if (day === currentDay && !isDayTimeLocked(day)) return "current";
    return "locked";
  };

  const canOpen = (day: number) => {
    if (isAdmin) return true;
    if (!hasAccessToDay(day)) return false;
    const s = getStatus(day);
    return s === "current" || s === "completed";
  };

  const getMediaUrl = (day: number, type: "video" | "hypnosis") => {
    const bucket = type === "video" ? "videos" : "hypnosis";
    const ext = type === "video" ? "mp4" : day >= 8 ? "MP3" : "mp3";
    const file = type === "video" ? `video_${day}.${ext}` : `hipnose_${day}.${ext}`;
    return `https://kpewsvpufzkyejchncta.supabase.co/storage/v1/object/public/${bucket}/${file}`;
  };

  const openMedia = async (day: number, type: "video" | "hypnosis", title: string) => {
    if (!canOpen(day)) {
      if (!isAdmin && day >= 2 && !isPremium && !isExpired) {
        navigate("/paywall");
        return;
      }
      toast({
        title: "Conteúdo bloqueado",
        description: "Complete o dia anterior para desbloquear",
        variant: "destructive",
      });
      return;
    }
    const interactionType = `${type === "video" ? "video" : "hipnose"}_dia_${day}`;
    setSelectedMedia({
      title,
      fileUrl: getMediaUrl(day, type),
      contentType: type,
      day,
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (
    authLoading ||
    profileLoading ||
    adminLoading ||
    contentLoading ||
    trackingLoading ||
    subLoading
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-32">
      <WaveBackground />

      <div className="mx-auto max-w-md px-5 pt-[env(safe-area-inset-top)]">
        {/* Header (matches Dashboard) */}
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

        {/* Page title */}
        <div className="mt-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[hsl(220_90%_55%)] to-[hsl(230_90%_45%)] bg-clip-text text-transparent">
            Jornada
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Seu plano de 14 dias para a liberdade.
          </p>
        </div>

        {/* Phase 1 */}
        <PhaseCard
          phaseNumber={1}
          name="Preparação"
          rangeLabel="Dias 1 a 7"
          accent="blue"
          icon={<Brain className="h-5 w-5" />}
        >
          <div className="relative">
            {phase1Days.map((d, i) => (
              <DayRow
                key={d.id}
                index={i}
                isLast={i === phase1Days.length - 1}
                day={d.day_number}
                title={d.title}
                videoMin={d.video_minutes ?? undefined}
                hypnosisMin={d.hypnosis_minutes ?? undefined}
                showVideo
                status={getStatus(d.day_number)}
                onVideo={() => openMedia(d.day_number, "video", d.title)}
                onHypnosis={() => openMedia(d.day_number, "hypnosis", d.title)}
                accent="blue"
              />
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-xl bg-[hsl(220_85%_97%)] px-3 py-2.5">
            <Sparkles className="h-4 w-4 text-[hsl(230_85%_55%)] flex-shrink-0" />
            <p className="text-xs text-[hsl(220_50%_30%)] leading-snug">
              Ao final do Dia 7, você dará adeus ao cigarro e começará a Fase 2.
            </p>
          </div>
        </PhaseCard>

        {/* Phase 2 */}
        <PhaseCard
          phaseNumber={2}
          name="Libertação"
          rangeLabel="Dias 8 a 14"
          accent="purple"
          icon={<ShieldCheck className="h-5 w-5" />}
        >
          {phase2Days.map((d, i) => (
            <DayRow
              key={d.id}
              index={i}
              isLast={i === phase2Days.length - 1}
              day={d.day_number}
              title={d.title}
              hypnosisMin={d.hypnosis_minutes ?? undefined}
              status={getStatus(d.day_number)}
              onHypnosis={() => openMedia(d.day_number, "hypnosis", d.title)}
              accent="purple"
              compact
            />
          ))}
        </PhaseCard>
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
    </div>
  );
}

/* ---------- Sub-components ---------- */

function PhaseCard({
  phaseNumber,
  name,
  rangeLabel,
  accent,
  icon,
  children,
}: {
  phaseNumber: number;
  name: string;
  rangeLabel: string;
  accent: "blue" | "purple";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const colors =
    accent === "blue"
      ? {
          iconBg: "bg-[hsl(220_85%_96%)]",
          iconColor: "text-[hsl(230_85%_55%)]",
          phaseLabel: "text-[hsl(230_85%_55%)]",
          chipBg: "bg-[hsl(220_85%_96%)]",
          chipText: "text-[hsl(230_85%_50%)]",
        }
      : {
          iconBg: "bg-[hsl(258_80%_96%)]",
          iconColor: "text-[hsl(258_70%_55%)]",
          phaseLabel: "text-[hsl(258_70%_55%)]",
          chipBg: "bg-[hsl(258_80%_96%)]",
          chipText: "text-[hsl(258_70%_50%)]",
        };

  return (
    <section className="mt-6 rounded-3xl bg-white/85 backdrop-blur-md border-0 shadow-[0_18px_50px_-18px_hsl(230_60%_40%/0.22)] ring-1 ring-black/[0.03] p-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-2xl ${colors.iconBg} ${colors.iconColor} flex items-center justify-center shadow-sm`}
          >
            {icon}
          </div>
          <h2 className="text-lg">
            <span className={`font-semibold ${colors.phaseLabel}`}>Fase {phaseNumber}</span>
            <span className="text-foreground/30 mx-1.5">•</span>
            <span className="font-bold text-[hsl(220_30%_25%)]">{name}</span>
          </h2>
        </div>
        <span
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${colors.chipBg} ${colors.chipText}`}
        >
          {rangeLabel}
        </span>
      </header>

      <div className="mt-3 border-t border-[hsl(220_30%_94%)] pt-1">{children}</div>
    </section>
  );
}

function DayRow({
  index,
  isLast,
  day,
  title,
  videoMin,
  hypnosisMin,
  showVideo,
  status,
  onVideo,
  onHypnosis,
  accent,
  compact,
}: {
  index: number;
  isLast: boolean;
  day: number;
  title: string;
  videoMin?: number;
  hypnosisMin?: number;
  showVideo?: boolean;
  status: DayStatus;
  onVideo?: () => void;
  onHypnosis?: () => void;
  accent: "blue" | "purple";
  compact?: boolean;
}) {
  const isLocked = status === "locked";
  const isCompleted = status === "completed";
  const isCurrent = status === "current";

  const accentFrom = accent === "blue" ? "hsl(230, 85%, 55%)" : "hsl(258, 70%, 55%)";
  const accentTo = accent === "blue" ? "hsl(258, 80%, 60%)" : "hsl(280, 70%, 60%)";

  const numberCircle = (() => {
    if (isCompleted) {
      return (
        <div
          className="h-9 w-9 rounded-full flex items-center justify-center text-white shadow-md"
          style={{ background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})` }}
        >
          <Check className="h-4 w-4" strokeWidth={3} />
        </div>
      );
    }
    if (isCurrent) {
      return (
        <div
          className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md ring-4 ring-white"
          style={{ background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})` }}
        >
          {day}
        </div>
      );
    }
    return (
      <div className="h-9 w-9 rounded-full flex items-center justify-center text-[hsl(220_20%_55%)] text-sm font-semibold bg-white border border-[hsl(220_30%_88%)] shadow-sm">
        {day}
      </div>
    );
  })();

  return (
    <div className="relative">
      {/* timeline connector — continuous "path" */}
      {!isLast && (
        <div
          aria-hidden
          className="absolute left-[17px] top-10 bottom-0 w-0.5 rounded-full"
          style={{
            background: isCompleted
              ? `linear-gradient(to bottom, ${accentFrom}, ${accentTo})`
              : isCurrent
              ? `linear-gradient(to bottom, ${accentFrom}, hsl(220, 30%, 88%))`
              : "hsl(220, 30%, 90%)",
            opacity: isLocked ? 0.6 : 1,
          }}
        />
      )}

      <div className={`flex items-center gap-3 py-3 ${index === 0 ? "pt-3" : ""}`}>
        <div className="flex-shrink-0 z-10">{numberCircle}</div>

        <p
          className={`flex-1 text-sm leading-tight ${
            isLocked
              ? "text-muted-foreground"
              : isCurrent
              ? "font-semibold text-foreground"
              : "text-foreground"
          }`}
        >
          {title}
        </p>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          {showVideo && (
            <MediaIconButton
              type="video"
              minutes={videoMin}
              disabled={isLocked}
              active={!isLocked}
              accent={accent}
              onClick={onVideo}
            />
          )}
          <MediaIconButton
            type="hypnosis"
            minutes={hypnosisMin}
            disabled={isLocked}
            active={!isLocked}
            accent={accent}
            onClick={onHypnosis}
          />
          {isLocked && (
            <Lock className="h-4 w-4 text-muted-foreground/60 ml-0.5" aria-label="Bloqueado" />
          )}
        </div>
      </div>

      {!isLast && <div className="ml-12 border-t border-[hsl(220_30%_94%)]" />}
    </div>
  );
}

function MediaIconButton({
  type,
  minutes,
  disabled,
  active,
  accent,
  onClick,
}: {
  type: "video" | "hypnosis";
  minutes?: number;
  disabled?: boolean;
  active?: boolean;
  accent: "blue" | "purple";
  onClick?: () => void;
}) {
  const Icon = type === "video" ? Play : Headphones;
  const label = type === "video" ? "Vídeo" : "Hipnose";

  const activeBg =
    accent === "blue"
      ? "bg-gradient-to-br from-[hsl(220_85%_60%)] to-[hsl(230_85%_55%)]"
      : "bg-gradient-to-br from-[hsl(258_70%_60%)] to-[hsl(280_70%_60%)]";
  const activeText =
    accent === "blue" ? "text-[hsl(230_85%_50%)]" : "text-[hsl(258_70%_50%)]";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-0.5 transition-transform active:scale-95 ${
        disabled ? "opacity-40 cursor-not-allowed" : ""
      }`}
    >
      <div
        className={`h-9 w-9 rounded-full flex items-center justify-center ${
          active
            ? `${activeBg} shadow-md`
            : "bg-white border border-[hsl(220_30%_90%)]"
        }`}
      >
        <Icon
          className={`h-4 w-4 ${active ? "text-white" : "text-muted-foreground"} ${
            type === "video" && active ? "fill-white" : ""
          }`}
        />
      </div>
      <span className={`text-[10px] font-medium ${active ? activeText : "text-muted-foreground"}`}>
        {label}
      </span>
    </button>
  );
}
