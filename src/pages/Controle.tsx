import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  HelpCircle,
  Headphones,
  LogOut,
  User,
  Zap,
  Play,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useSubscription } from "@/hooks/useSubscription";
import { useSosHypnosis } from "@/hooks/useSosHypnosis";
import { useJourneyTracking } from "@/hooks/useJourneyTracking";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MediaPlayer from "@/components/MediaPlayer";
import BottomNav from "@/components/home/BottomNav";
import WaveBackground from "@/components/home/WaveBackground";
import soproLogo from "@/assets/sopro-logo.png";

const STORAGE_BASE =
  "https://kpewsvpufzkyejchncta.supabase.co/storage/v1/object/public/hypnosis";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
};

interface TriggerItem {
  id: string;
  title: string;
  description: string | null;
  file_name: string;
  duration_minutes: number | null;
  display_order: number | null;
}

export default function Controle() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { isPremium, loading: subLoading } = useSubscription();
  const { getSosHypnosis } = useSosHypnosis();
  const { startTracking, updateProgress, isLoading: trackingLoading } =
    useJourneyTracking();

  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);

  const firstName = (profile?.display_name || "").split(" ")[0] || "";

  const { data: triggers = [], isLoading: triggersLoading } = useQuery({
    queryKey: ["triggers_content_active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("triggers_content")
        .select("id,title,description,file_name,duration_minutes,display_order")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) {
        console.error("Error fetching triggers:", error);
        return [] as TriggerItem[];
      }
      return (data || []) as TriggerItem[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const canPlay = isAdmin || isPremium;

  const ensureAccess = () => {
    if (canPlay) return true;
    navigate("/paywall");
    return false;
  };

  const openMedia = async (
    title: string,
    fileUrl: string,
    interactionType: string,
  ) => {
    if (!ensureAccess()) return;
    setSelectedMedia({
      title,
      fileUrl,
      contentType: "hypnosis" as const,
      interactionType,
    });
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

  const handleTrigger = (t: TriggerItem) => {
    openMedia(
      t.title,
      `${STORAGE_BASE}/${t.file_name}`,
      `gatilho_${t.file_name.replace(/\.[^.]+$/, "")}`,
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (
    authLoading ||
    profileLoading ||
    adminLoading ||
    subLoading ||
    trackingLoading ||
    triggersLoading
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
        {/* Header (matches Dashboard / Jornada) */}
        <header className="flex items-center justify-between pt-4">
          <img src={soproLogo} alt="Sopro Neuro" className="h-10 w-auto" />
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground leading-tight">
                {getGreeting()}
                {firstName ? `, ${firstName}!` : "!"}
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

        {/* Title */}
        <div className="mt-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[hsl(220_90%_55%)] to-[hsl(230_90%_45%)] bg-clip-text text-transparent">
            Controle dos gatilhos
          </h1>
        </div>

        {/* SOS card */}
        <button
          onClick={handleSos}
          className="mt-5 w-full text-left rounded-3xl p-5 shadow-[0_18px_50px_-18px_hsl(230_70%_40%/0.5)] ring-1 ring-white/10 active:scale-[0.99] transition-transform"
          style={{
            background:
              "linear-gradient(135deg, hsl(220, 90%, 55%), hsl(258, 70%, 55%))",
          }}
        >
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 flex-shrink-0 rounded-full bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
              <Zap className="h-7 w-7 text-white" strokeWidth={2.5} fill="white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-lg font-bold leading-tight">
                Vontade de fumar agora?
              </p>
              <p className="text-white/85 text-sm leading-snug mt-1">
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

        {/* Trigger list */}
        <div className="mt-7">
          <h2 className="text-lg font-bold text-foreground">
            Hipnoses para gatilhos específicos
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
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

          {triggers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Em breve, novas hipnoses estarão disponíveis aqui.
            </p>
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
    </div>
  );
}