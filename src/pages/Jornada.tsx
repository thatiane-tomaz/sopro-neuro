import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useJourneyTracking } from "@/hooks/useJourneyTracking";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsFreelist } from "@/hooks/useIsFreelist";
import { useContentAccess } from "@/hooks/useContentAccess";
import { useContentTracking } from "@/hooks/useContentTracking";
import { supabase } from "@/integrations/supabase/client";
import { getSignedMediaUrl } from "@/lib/mediaUrl";
import { getThemeImageThumbUrl, getThemeImageUrl } from "@/lib/themeImage";
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
import soproLogo from "@/assets/sopro-logo.webp";
import { performLogout } from "@/lib/logout";

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
  subtitulo_habito: string | null;
  hasMissao: boolean;
  posicao_original: number | null;
  video_nome: string | null;
  hipnose_nome: string | null;
  imagem_nome: string | null;
  explicacao_missao: string | null;
  objetivo_chat_missao: string | null;
  hasVideo: boolean;
  hasHipnose: boolean;
  isIntro: boolean;
  isSelected: boolean;
};

type SheetTarget =
  | { kind: "journey"; idx: number }
  | { kind: "extra"; h: any };

const MISSAO_LOCK_MS = 24 * 60 * 60 * 1000;
const DEFAULT_MISSAO_TEXT =
  "Observe esse hábito nos próximos dias: em quais momentos ele aparece, o que você sente antes e o que muda depois. Anote mentalmente os padrões para conversarmos sobre sua experiência.";

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
  const { ensureContentAccess } = useContentAccess();
  const { trackContentView } = useContentTracking();
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

    // A jornada mostra APENAS os temas fixos + os gatilhos que o usuário
    // escolheu no onboarding. Temas não escolhidos não entram na jornada
    // (antes apareciam como "futuros" e pareciam gatilhos atribuídos pela IA).
    const ordered = [...fixed, ...selected];

    return ordered.map((h, idx) => ({
      id: h.id,
      seq: idx + 1,
      habito_titulo: h.habito_titulo,
      subtitulo_habito: h.subtitulo_habito?.trim() || null,
      posicao_original: h.posicao != null ? Number(h.posicao) : null,
      video_nome: h.video_nome ?? null,
      hipnose_nome: h.hipnose_nome ?? null,
      imagem_nome: h.imagem_nome ?? null,
      explicacao_missao: h.explicacao_missao?.trim() || null,
      objetivo_chat_missao: h.objetivo_chat_missao ?? null,
      hasVideo: h.video !== false && !!h.video_nome?.trim(),
      hasHipnose: h.hipnose !== false && !!h.hipnose_nome?.trim(),
      hasMissao: h.missao !== false,
      isIntro: fixedIds.has(h.id),
      isSelected: true,
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
        .select("id,habito_titulo,subtitulo_habito,video_nome,video,hipnose_nome,hipnose,posicao,imagem_nome")
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
    const signedUrl = await getSignedMediaUrl(bucket, fileName, type, type === "video" ? ["videos"] : ["hypnosis"]);
    if (!signedUrl) {
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
      fileUrl: signedUrl,
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
    // Admin (e freelist) enxergam tudo liberado
    if (isAdmin || isFreelist) return "current";
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
    return getSignedMediaUrl(bucket, fileName, type, type === "video" ? ["videos"] : ["hypnosis"]);
  };

  const openMedia = async (idx: number, type: "video" | "hypnosis") => {
    const it = items[idx];
    if (!it) return;
    // Todo o conteúdo exige assinatura ativa
    if (!ensureContentAccess({ source: type })) return;
    if (!canOpen(idx)) {
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
    trackContentView(type, interactionType);
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
    await performLogout(navigate);
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
              Uma jornada criada para você.
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
            </div>
          </div>
        )}

        {/* Themes list */}
        <section className="mt-5 -mx-2 rounded-3xl bg-white/85 backdrop-blur-md border-0 shadow-[0_18px_50px_-18px_hsl(230_60%_40%/0.22)] ring-1 ring-black/[0.03] px-3 py-3">
          {items.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Complete o onboarding para ver seus temas.
              </p>
            </div>
          ) : (
            (() => {
              const focusIndex = items.findIndex((_, i) => statusForIndex(i) !== "completed");
              const labelFor = (i: number) => {
                if (i === 0 && focusIndex !== 0) return "Já trabalhados";
                if (focusIndex !== -1 && i === focusIndex + 1) return "Próximos temas da sua jornada";
                return null;
              };
              return items.map((it, i) => {
                const isFocus = i === focusIndex;
                const pos = it.posicao_original ?? it.seq;
                const acts = [
                  it.hasVideo ? isFinished(interactionKey(it, "video")) : null,
                  it.hasHipnose ? isFinished(interactionKey(it, "hypnosis")) : null,
                  it.hasMissao ? isFinished(`${journeyKey}missao_semana_${pos}`) : null,
                ].filter((v) => v !== null) as boolean[];
                return (
                  <ThemeRow
                    key={it.id}
                    isFirst={i === 0}
                    isLast={i === items.length - 1}
                    label={labelFor(i)}
                    nextHasLabel={!!labelFor(i + 1)}
                    seq={it.seq}
                    title={it.habito_titulo}
                    subtitle={it.subtitulo_habito}
                    imagemNome={it.imagem_nome}
                    isIntro={it.isIntro}
                    status={statusForIndex(i)}
                    isFocus={isFocus}
                    activities={isFocus ? { done: acts.filter(Boolean).length, total: acts.length } : null}
                    hasVideo={it.hasVideo}
                    hasHipnose={it.hasHipnose}
                    onVideo={() => openMedia(i, "video")}
                    onHypnosis={() => openMedia(i, "hypnosis")}
                    onMural={() => openMural(i)}
                  />
                );
              });
            })()
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
                  isFirst={i === 0}
                  isLast={i === (temasReducao?.length ?? 0) - 1}
                  seq={i + 1}
                  title={h.habito_titulo}
                  subtitle={h.subtitulo_habito ?? null}
                  imagemNome={h.imagem_nome ?? null}
                  isIntro={false}
                  status="current"
                  hasVideo={h.video !== false && !!h.video_nome?.trim()}
                  hasHipnose={h.hipnose !== false && !!h.hipnose_nome?.trim()}
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

function ThemeThumb({
  imagemNome,
  isLocked,
  sizeClass,
}: {
  imagemNome: string | null;
  isLocked: boolean;
  sizeClass: string;
}) {
  const thumb = getThemeImageThumbUrl(imagemNome, 200);
  const original = getThemeImageUrl(imagemNome);
  const [src, setSrc] = useState<string | null>(thumb);
  const [failed, setFailed] = useState(false);

  if (!thumb || failed) {
    return (
      <div
        aria-hidden
        className={`${sizeClass} flex-shrink-0 rounded-xl bg-gradient-to-br from-[hsl(220_85%_93%)] to-[hsl(258_70%_90%)] ${
          isLocked ? "opacity-60" : ""
        }`}
      />
    );
  }

  return (
    <img
      src={src ?? thumb}
      alt=""
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => {
        if (src !== original && original) setSrc(original);
        else setFailed(true);
      }}
      className={`${sizeClass} flex-shrink-0 rounded-xl object-cover shadow-[0_6px_16px_-8px_hsl(230_60%_40%/0.35)] ${
        isLocked ? "opacity-60 grayscale-[35%]" : ""
      }`}
    />
  );
}

function ThemeRow({
  isFirst,
  isLast,
  label,
  nextHasLabel,
  seq,
  title,
  subtitle,
  imagemNome,
  isIntro,
  status,
  isFocus = false,
  activities,
  hasVideo,
  hasHipnose,
  onVideo,
  onHypnosis,
  onMural,
}: {
  isFirst: boolean;
  isLast: boolean;
  label?: string | null;
  nextHasLabel?: boolean;
  seq: number;
  title: string;
  subtitle: string | null;
  imagemNome: string | null;
  isIntro: boolean;
  status: DayStatus;
  isFocus?: boolean;
  activities?: { done: number; total: number } | null;
  hasVideo: boolean;
  hasHipnose: boolean;
  onVideo: () => void;
  onHypnosis: () => void;
  onMural: () => void;
}) {
  const isLocked = status === "locked";
  const isCompleted = status === "completed";

  const accentFrom = isIntro ? "hsl(220, 90%, 55%)" : "hsl(230, 85%, 55%)";
  const accentTo = "hsl(258, 80%, 60%)";

  const numberCircle = (() => {
    if (isCompleted) {
      return (
        <div
          className="h-5 w-5 rounded-full flex items-center justify-center text-white shadow-sm"
          style={{ background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})` }}
        >
          <Check className="h-3 w-3" strokeWidth={3} />
        </div>
      );
    }
    if (isFocus) {
      return (
        <div
          className="h-6 w-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-sm ring-2 ring-[hsl(258_80%_92%)]"
          style={{ background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})` }}
        >
          {seq}
        </div>
      );
    }
    return (
      <div className="h-5 w-5 rounded-full flex items-center justify-center text-[hsl(220_20%_55%)] text-[10px] font-semibold bg-white border border-[hsl(220_30%_88%)]">
        {seq}
      </div>
    );
  })();

  const lineColor = isCompleted ? accentTo : "hsl(220, 30%, 90%)";

  const cardClass = isFocus
    ? "bg-gradient-to-br from-[hsl(258_85%_96%)] to-[hsl(228_85%_96%)] ring-1 ring-[hsl(258_70%_88%)] shadow-[0_12px_30px_-18px_hsl(258_70%_45%/0.45)]"
    : "bg-[hsl(225_60%_97.5%)] ring-1 ring-[hsl(225_40%_92%)]";

  return (
    <div>
      {label && (
        <p className={`px-1 pb-1 text-xs font-medium text-muted-foreground ${isFirst ? "" : "pt-2.5"}`}>
          {label}
        </p>
      )}

      <div className="relative flex items-center gap-1.5 py-1">
        {/* Linha da trilha (metade de cima / metade de baixo) */}
        {!isFirst && !label && (
          <div
            aria-hidden
            className="absolute left-3 top-0 h-1/2 w-px -translate-x-1/2"
            style={{ background: lineColor }}
          />
        )}
        {!isLast && !nextHasLabel && (
          <div
            aria-hidden
            className="absolute left-3 top-1/2 bottom-0 w-px -translate-x-1/2"
            style={{ background: lineColor }}
          />
        )}

        <div className="z-10 flex w-6 flex-shrink-0 justify-center">{numberCircle}</div>

        <div className={`min-w-0 flex-1 rounded-2xl px-2 py-1.5 ${cardClass}`}>
          <div className="flex items-center gap-2.5">
            <ThemeThumb
              imagemNome={imagemNome}
              isLocked={isLocked}
              sizeClass={isFocus ? "h-12 w-12" : "h-10 w-10"}
            />
            <div className="min-w-0 flex-1">
              {isFocus && (
                <span className="mb-0.5 inline-flex rounded-md bg-[hsl(258_80%_92%)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[hsl(258_60%_45%)]">
                  Seu foco atual
                </span>
              )}
              <p
                className={`text-balance text-sm font-semibold leading-tight ${
                  isLocked ? "text-foreground/70" : "text-foreground"
                }`}
              >
                {title}
              </p>
              {subtitle && (
                <p className="mt-0.5 text-balance text-[11px] leading-snug text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
            {isLocked && (
              <Lock className="h-4 w-4 flex-shrink-0 text-muted-foreground/60" aria-label="Bloqueado" />
            )}
          </div>

          {!isLocked && (
            <div className={`mt-1.5 flex flex-wrap items-center gap-1.5 ${isFocus ? "pl-[58px]" : "pl-[50px]"}`}>
              {hasVideo && (
                <ActionChip
                  icon={<Play className="h-3.5 w-3.5 fill-current" />}
                  label="Vídeo"
                  variant="video"
                  onClick={onVideo}
                />
              )}
              {hasHipnose && (
                <ActionChip
                  icon={<Headphones className="h-3.5 w-3.5" />}
                  label="Hipnose"
                  variant="hipnose"
                  onClick={onHypnosis}
                />
              )}
              <ActionChip
                icon={<MessageCircleHeart className="h-3.5 w-3.5" />}
                label="Mural"
                variant="mural"
                onClick={onMural}
              />
            </div>
          )}
        </div>
      </div>
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
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm active:scale-95 transition-transform ${styles.bg} ${styles.text} ${
        disabled ? "opacity-40 cursor-not-allowed" : ""
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
