import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useJourneyTracking } from "@/hooks/useJourneyTracking";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsFreelist } from "@/hooks/useIsFreelist";
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
  User,
  LogOut,
  HelpCircle,
  MessageCircleHeart,
  Info,
  Sparkles,
} from "lucide-react";
import MediaPlayer from "@/components/MediaPlayer";
import WaveBackground from "@/components/home/WaveBackground";
import BottomNav from "@/components/home/BottomNav";
import PageLoader from "@/components/home/PageLoader";
import { getStartHereVideoUrl } from "@/lib/startHereVideo";
import soproLogo from "@/assets/sopro-logo.png";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
};

type DayStatus = "completed" | "current" | "locked";

type JornadaItem = {
  id: string;
  seq: number; // 1..N — used for interaction & media file mapping
  habito_titulo: string;
  posicao_original: number | null;
  video_nome: string | null;
  hipnose_nome: string | null;
  hasVideo: boolean;
  hasHipnose: boolean;
  isIntro: boolean;
  isSelected: boolean;
};

const JORNADA_MAP: Record<string, string> = {
  abstinencia: "abstinência",
  reducao: "redução",
};

export default function Jornada() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { isPremium, isExpired, loading: subLoading } = useSubscription();
  const { isFreelist, loading: freelistLoading } = useIsFreelist();
  const {
    trackingData,
    startTracking,
    updateProgress,
    isLoading: trackingLoading,
  } = useJourneyTracking();

  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [loadingStartHere, setLoadingStartHere] = useState(false);

  const firstName = (profile?.display_name || "").split(" ")[0] || "";


  // ---- Load latest jornada type from historico (source of truth) ----
  const { data: historicoJornada, isLoading: histLoading } = useQuery({
    queryKey: ["historico-jornada", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("historico_jornada_usuario")
        .select("jornada, created_at, habitos_selecionados")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error("historico jornada error", error);
        return null;
      }
      return data as {
        jornada: string;
        created_at: string;
        habitos_selecionados: string[] | null;
      } | null;
    },
  });

  // ---- Load user's onboarding (habits chosen + jornada) ----
  const { data: onboardingV2, isLoading: onbLoading } = useQuery({
    queryKey: ["onboarding-v2-jornada", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("onboarding_responses_v2")
        .select("respostas, jornada_inicial")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error("onboarding v2 error", error);
        return null;
      }
      return data as { respostas: any; jornada_inicial: string } | null;
    },
  });

  // Priority: latest historico entry → onboarding v2 initial → default "reducao".
  const jornadaRaw =
    historicoJornada?.jornada ?? onboardingV2?.jornada_inicial ?? "reducao";
  const tipoUsuario = JORNADA_MAP[jornadaRaw] ?? "redução";
  const habitosSelecionados: string[] = useMemo(
    () => {
      // If the user returned to redução via the AI chat, the latest historico entry
      // carries the AI-selected habit titles — those take precedence.
      if (Array.isArray(historicoJornada?.habitos_selecionados) && historicoJornada!.habitos_selecionados!.length > 0) {
        return historicoJornada!.habitos_selecionados as string[];
      }
      return Array.isArray(onboardingV2?.respostas?.habitosSelecionados)
        ? (onboardingV2!.respostas.habitosSelecionados as string[])
        : [];
    },
    [onboardingV2, historicoJornada],
  );

  // ---- Load habitos_jornada for this journey type ----
  const { data: allHabitos, isLoading: habitosLoading } = useQuery({
    queryKey: ["habitos-jornada", tipoUsuario],
    enabled: !!tipoUsuario,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("habitos_jornada")
        .select("*")
        .eq("tipo_usuario", tipoUsuario);
      if (error) {
        console.error("habitos error", error);
        return [];
      }
      return (data as any[]) || [];
    },
  });

  // ---- Build ordered list ----
  const items = useMemo<JornadaItem[]>(() => {
    if (!allHabitos || allHabitos.length === 0) return [];
    // Fixed themes appear for every user, ordered by posicao
    const fixed = allHabitos
      .filter((h) => h.tema_fixo === true)
      .sort((a, b) => {
        const pa = a.posicao != null ? Number(a.posicao) : Infinity;
        const pb = b.posicao != null ? Number(b.posicao) : Infinity;
        return pa - pb;
      });
    const fixedIds = new Set(fixed.map((h) => h.id));
    const byTitle = new Map<string, any>();
    allHabitos.forEach((h) => byTitle.set(h.habito_titulo, h));

    // Selected habits (user chose in onboarding), dedup, exclude fixed
    const seen = new Set<string>();
    const selected: any[] = [];
    habitosSelecionados.forEach((t) => {
      if (seen.has(t)) return;
      const h = byTitle.get(t);
      if (h && !fixedIds.has(h.id)) {
        selected.push(h);
        seen.add(t);
      }
    });

    // Sort selected: numeric posicao asc first, nulls preserve user's selection order
    selected.sort((a, b) => {
      const pa = a.posicao != null ? Number(a.posicao) : Infinity;
      const pb = b.posicao != null ? Number(b.posicao) : Infinity;
      if (pa !== pb) return pa - pb;
      return 0;
    });

    // Remaining habits (not fixed and not selected) — appear as future/locked
    // so the user sees the full journey ahead.
    const selectedIds = new Set(selected.map((h) => h.id));
    const rest = allHabitos
      .filter(
        (h) =>
          !fixedIds.has(h.id) &&
          !selectedIds.has(h.id),
      )
      .sort((a, b) => {
        const pa = a.posicao != null ? Number(a.posicao) : Infinity;
        const pb = b.posicao != null ? Number(b.posicao) : Infinity;
        if (pa !== pb) return pa - pb;
        return String(a.habito_titulo).localeCompare(String(b.habito_titulo), "pt-BR");
      });

    const ordered = [
      ...fixed,
      ...selected,
      ...rest,
    ];
    return ordered.map((h, idx) => ({
      id: h.id,
      seq: idx + 1,
      habito_titulo: h.habito_titulo,
      posicao_original: h.posicao != null ? Number(h.posicao) : null,
      video_nome: h.video_nome ?? null,
      hipnose_nome: h.hipnose_nome ?? null,
      hasVideo: h.video !== false,
      hasHipnose: h.hipnose !== false,
      isIntro: fixedIds.has(h.id),
      isSelected: fixedIds.has(h.id) || selectedIds.has(h.id),
    }));
  }, [allHabitos, habitosSelecionados]);

  // ---- Progress helpers ----
  const isFinished = (interactionType: string) =>
    !!trackingData?.some((t) => t.interaction_type === interactionType && t.finished_at !== null);

  // Chaves de progresso compartilhadas com o Dashboard: prefixo da jornada +
  // posição original do tema em habitos_jornada (estável, não muda se o
  // usuário alterar os hábitos selecionados).
  const journeyKey = tipoUsuario === "abstinência" ? "abst_" : "";
  const interactionKey = (it: JornadaItem, type: "video" | "hypnosis") => {
    const pos = it.posicao_original ?? it.seq;
    return type === "video"
      ? `${journeyKey}video_semana_${pos}`
      : `${journeyKey}hipnose_semana_${pos}`;
  };

  // ---- Hipnoses da jornada de redução (liberadas para quem está na abstinência) ----
  const isAbstinencia = tipoUsuario === "abstinência";
  const { data: temasReducao } = useQuery({
    queryKey: ["hipnoses-reducao-extra"],
    enabled: isAbstinencia,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("habitos_jornada")
        .select("id,habito_titulo,video_nome,video,hipnose_nome,hipnose,posicao")
        .eq("tipo_usuario", "redução");
      if (error) {
        console.error("hipnoses reducao error", error);
        return [];
      }
      return ((data as any[]) || [])
        .sort((a, b) => {
          const pa = a.posicao != null ? Number(a.posicao) : Infinity;
          const pb = b.posicao != null ? Number(b.posicao) : Infinity;
          if (pa !== pb) return pa - pb;
          return String(a.habito_titulo).localeCompare(String(b.habito_titulo), "pt-BR");
        });
    },
  });

  const openMediaReducao = async (h: any, type: "video" | "hypnosis") => {
    const bucket = type === "video" ? "videos_2" : "hipnoses_2";
    const fileName = type === "video" ? h.video_nome : h.hipnose_nome;
    if (!fileName) {
      toast({
        title: "Conteúdo em preparação",
        description:
          type === "video"
            ? "O vídeo deste tema ainda será disponibilizado."
            : "A hipnose deste tema ainda será disponibilizada.",
      });
      return;
    }
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(fileName, 60 * 60);
    if (error || !data?.signedUrl) {
      toast({
        title: "Conteúdo em preparação",
        description: "Este conteúdo ainda será disponibilizado.",
      });
      return;
    }
    const interactionType =
      type === "video" ? `video_apoio_${h.id}` : `hipnose_apoio_${h.id}`;
    setSelectedMedia({
      title: h.habito_titulo,
      fileUrl: data.signedUrl,
      contentType: type,
      day: 0,
      interactionType,
    });
    try {
      const r = await startTracking({ interactionType });
      if (r?.id) setTrackingId(r.id);
    } catch (e) {
      console.error(e);
    }
  };

  // Vídeo "Comece aqui" (bucket videos_2 -> comece_reducao)
  const openStartHereVideo = async () => {
    setLoadingStartHere(true);
    const url = await getStartHereVideoUrl("comece_reducao");
    setLoadingStartHere(false);
    if (!url) {
      toast({
        title: "Conteúdo em preparação",
        description: "O vídeo de introdução ainda será disponibilizado.",
      });
      return;
    }
    setSelectedMedia({
      title: "Comece aqui",
      fileUrl: url,
      contentType: "video",
      day: 0,
      interactionType: "comece_aqui_reducao",
    });
  };

  const itemCompleted = (it: JornadaItem) => {
    const needsVideo = it.hasVideo;
    const needsHip = it.hasHipnose;
    const v = needsVideo ? isFinished(interactionKey(it, "video")) : true;
    const h = needsHip ? isFinished(interactionKey(it, "hypnosis")) : true;
    return v && h;
  };

  const statusForIndex = (idx: number): DayStatus => {
    if (itemCompleted(items[idx])) return "completed";
    // current if all previous items are completed
    for (let i = 0; i < idx; i++) {
      if (!itemCompleted(items[i])) return "locked";
    }
    return "current";
  };

  const canOpen = (idx: number) => {
    if (isAdmin || isFreelist) return true;
    const s = statusForIndex(idx);
    return s === "current" || s === "completed";
  };

  // ---- Media ----
  // Vídeos e hipnoses vêm dos buckets privados videos_2 / hipnoses_2 usando
  // habitos_jornada.video_nome / habitos_jornada.hipnose_nome.
  const getMediaUrl = async (
    it: JornadaItem,
    type: "video" | "hypnosis",
  ): Promise<string | null> => {
    const bucket = type === "video" ? "videos_2" : "hipnoses_2";
    const fileName = type === "video" ? it.video_nome : it.hipnose_nome;
    if (!fileName) return null;
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(fileName, 60 * 60);
    if (error || !data?.signedUrl) {
      console.error("signed url error", error);
      return null;
    }
    return data.signedUrl;
  };

  const openMedia = async (idx: number, type: "video" | "hypnosis") => {
    const it = items[idx];
    if (!it) return;
    if (!canOpen(idx)) {
      if (!isAdmin && !isFreelist && idx >= 1 && !isPremium && !isExpired) {
        navigate("/paywall");
        return;
      }
      toast({
        title: "Tema bloqueado",
        description: "Complete o tema anterior para desbloquear este.",
        variant: "destructive",
      });
      return;
    }
    const url = await getMediaUrl(it, type);
    if (!url) {
      toast({
        title: "Conteúdo em preparação",
        description:
          type === "video"
            ? "O vídeo deste tema ainda será disponibilizado."
            : "A hipnose deste tema ainda será disponibilizada.",
      });
      return;
    }
    const interactionType = interactionKey(it, type);
    setSelectedMedia({
      title: it.habito_titulo,
      fileUrl: url,
      contentType: type,
      day: it.seq,
      interactionType,
    });
    try {
      const r = await startTracking({ interactionType });
      if (r?.id) setTrackingId(r.id);
    } catch (e) {
      console.error(e);
    }
  };

  const openMural = (idx: number) => {
    const it = items[idx];
    if (!it) return;
    if (!canOpen(idx)) {
      toast({
        title: "Tema bloqueado",
        description: "Complete o tema anterior para acessar o mural deste.",
        variant: "destructive",
      });
      return;
    }
    navigate(`/mural?tema=${encodeURIComponent(it.habito_titulo)}`);
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
    trackingLoading ||
    subLoading ||
    freelistLoading ||
    onbLoading ||
    histLoading ||
    habitosLoading
  ) {
    return <PageLoader />;
  }
  if (!user) return <Navigate to="/login" replace />;

  const totalDone = items.filter((_, i) => statusForIndex(i) === "completed").length;

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-32">
      <WaveBackground />

      <div className="mx-auto max-w-md animate-page-in px-5 pt-[env(safe-area-inset-top)]">
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
        <div className="mt-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-[hsl(220_90%_55%)] to-[hsl(230_90%_45%)] bg-clip-text text-transparent">
              Jornada
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Uma jornada montada para você.
            </p>
          </div>
          <button
            onClick={openStartHereVideo}
            disabled={loadingStartHere}
            className="h-9 w-9 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-[0_4px_14px_-4px_hsl(220_40%_40%/0.18)] ring-1 ring-black/[0.03] active:scale-95 transition-transform"
            aria-label="Como funciona"
          >
            <Info className="h-4 w-4 text-[hsl(230_85%_55%)]" />
          </button>
        </div>

        {/* Progress chip */}
        {items.length > 0 && (
          <div className="mt-4 rounded-2xl bg-white/85 backdrop-blur ring-1 ring-black/[0.04] shadow-[0_10px_30px_-16px_hsl(230_60%_40%/0.25)] px-4 py-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-[hsl(220_85%_96%)] flex items-center justify-center text-[hsl(230_85%_55%)]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-foreground leading-tight">
                {totalDone} de {items.length} temas concluídos
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                Assista, ouça e compartilhe no mural de cada tema.
              </p>
            </div>
          </div>
        )}

        {/* Themes list */}
        <section className="mt-5 rounded-3xl bg-white/85 backdrop-blur-md border-0 shadow-[0_18px_50px_-18px_hsl(230_60%_40%/0.22)] ring-1 ring-black/[0.03] p-4">
          {items.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Complete o onboarding para ver seus temas.
              </p>
            </div>
          ) : (
            items.map((it, i) => (
              <ThemeRow
                key={it.id}
                index={i}
                isLast={i === items.length - 1}
                seq={it.seq}
                title={it.habito_titulo}
                isIntro={it.isIntro}
                status={statusForIndex(i)}
                hasVideo={it.hasVideo}
                hasHipnose={it.hasHipnose}
                onVideo={() => openMedia(i, "video")}
                onHypnosis={() => openMedia(i, "hypnosis")}
                onMural={() => openMural(i)}
              />
            ))
          )}
        </section>

        {/* Hipnoses da redução liberadas para quem está na abstinência */}
        {isAbstinencia && (temasReducao?.length ?? 0) > 0 && (
          <section className="mt-5 rounded-3xl bg-white/85 backdrop-blur-md shadow-[0_18px_50px_-18px_hsl(230_60%_40%/0.22)] ring-1 ring-black/[0.03] p-4">
            <div className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 flex-shrink-0 text-[hsl(258_65%_52%)]" />
              <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[hsl(258_60%_45%)]">
                Extras
              </span>
            </div>
            <h2 className="mt-1 text-lg font-bold bg-gradient-to-r from-[hsl(220_90%_55%)] to-[hsl(258_70%_55%)] bg-clip-text text-transparent leading-tight">
              Hipnoses de Apoio
            </h2>

            <div className="mt-3 pt-1 border-t border-[hsl(220_30%_94%)]">
              {(temasReducao ?? []).map((h: any, i: number) => (
                <ThemeRow
                  key={h.id}
                  index={i}
                  isLast={i === (temasReducao?.length ?? 0) - 1}
                  seq={i + 1}
                  title={h.habito_titulo}
                  isIntro={false}
                  status="current"
                  hasVideo={h.video !== false}
                  hasHipnose={h.hipnose !== false}
                  onVideo={() => openMediaReducao(h, "video")}
                  onHypnosis={() => openMediaReducao(h, "hypnosis")}
                  onMural={() =>
                    navigate(`/mural?tema=${encodeURIComponent(h.habito_titulo)}`)
                  }
                />
              ))}
            </div>
          </section>
        )}
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

function ThemeRow({
  index,
  isLast,
  seq,
  title,
  isIntro,
  status,
  hasVideo,
  hasHipnose,
  onVideo,
  onHypnosis,
  onMural,
}: {
  index: number;
  isLast: boolean;
  seq: number;
  title: string;
  isIntro: boolean;
  status: DayStatus;
  hasVideo: boolean;
  hasHipnose: boolean;
  onVideo: () => void;
  onHypnosis: () => void;
  onMural: () => void;
}) {
  const isLocked = status === "locked";
  const isCompleted = status === "completed";
  const isCurrent = status === "current";

  const accentFrom = isIntro ? "hsl(220, 90%, 55%)" : "hsl(230, 85%, 55%)";
  const accentTo = isIntro ? "hsl(258, 80%, 60%)" : "hsl(258, 80%, 60%)";

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
          {seq}
        </div>
      );
    }
    return (
      <div className="h-9 w-9 rounded-full flex items-center justify-center text-[hsl(220_20%_55%)] text-sm font-semibold bg-white border border-[hsl(220_30%_88%)] shadow-sm">
        {seq}
      </div>
    );
  })();

  return (
    <div className="relative">
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

      <div className={`flex flex-col gap-2 py-3 ${index === 0 ? "pt-3" : ""}`}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 z-10">{numberCircle}</div>
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm leading-tight ${
                isLocked
                  ? "text-muted-foreground"
                  : isCurrent
                  ? "font-semibold text-foreground"
                  : "text-foreground"
              }`}
            >
              {title}
            </p>
          </div>
          {isLocked && (
            <Lock className="h-4 w-4 text-muted-foreground/60" aria-label="Bloqueado" />
          )}
        </div>

        <div className="pl-12 flex items-center gap-2">
          {hasVideo && (
            <ActionChip
              icon={<Play className={`h-3.5 w-3.5 ${!isLocked ? "fill-current" : ""}`} />}
              label="Vídeo"
              disabled={isLocked}
              variant="video"
              onClick={onVideo}
            />
          )}
          {hasHipnose && (
            <ActionChip
              icon={<Headphones className="h-3.5 w-3.5" />}
              label="Hipnose"
              disabled={isLocked}
              variant="hipnose"
              onClick={onHypnosis}
            />
          )}
          <ActionChip
            icon={<MessageCircleHeart className="h-3.5 w-3.5" />}
            label="Mural"
            disabled={isLocked}
            variant="mural"
            onClick={onMural}
          />
        </div>
      </div>

      {!isLast && <div className="ml-12 border-t border-[hsl(220_30%_94%)]" />}
    </div>
  );
}

function ActionChip({
  icon,
  label,
  disabled,
  variant,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  variant: "video" | "hipnose" | "mural";
  onClick: () => void;
}) {
  const styles = {
    video: {
      bg: "bg-gradient-to-br from-[hsl(220_85%_60%)] to-[hsl(230_85%_55%)]",
      text: "text-white",
    },
    hipnose: {
      bg: "bg-gradient-to-br from-[hsl(258_70%_60%)] to-[hsl(280_70%_60%)]",
      text: "text-white",
    },
    mural: {
      bg: "bg-white ring-1 ring-[hsl(258_70%_88%)]",
      text: "text-[hsl(258_60%_45%)]",
    },
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold shadow-sm active:scale-95 transition-transform ${styles.bg} ${styles.text} ${
        disabled ? "opacity-40 cursor-not-allowed" : ""
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
