import { useEffect, useMemo, useState } from "react";
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
import { useScrollLock } from "@/hooks/useScrollLock";
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
  Lock,
  Check,
  User,
  LogOut,
  HelpCircle,
  Info,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";
import MediaPlayer from "@/components/MediaPlayer";
import WaveBackground from "@/components/home/WaveBackground";
import BottomNav from "@/components/home/BottomNav";
import PageLoader from "@/components/home/PageLoader";
import { getStartHereVideoUrl } from "@/lib/startHereVideo";
import soproLogo from "@/assets/sopro-logo.webp";
import stepHipnoseImg from "@/assets/step-hipnose.png";
import stepMissaoImg from "@/assets/step-missao.png";
import stepMuralImg from "@/assets/step-mural.png";
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
      // Os temas não têm mais vídeo (Transforme, Experimente e Compartilhe).
      hasVideo: false,
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

  // Tema concluído = hipnose e missão existentes concluídas (mesma regra da
  // tela inicial). O mural não conta para a conclusão.
  const itemCompleted = (it: JornadaItem) => {
    const checks: boolean[] = [];
    if (it.hasHipnose) checks.push(isFinished(interactionKey(it, "hypnosis")));
    if (it.hasMissao) checks.push(isFinished(missaoKeys(it).done));
    return checks.length > 0 && checks.every(Boolean);
  };

  // Todos os temas da jornada ficam sempre abertos (sem bloqueio sequencial).
  // A assinatura continua sendo exigida ao abrir cada conteúdo.
  const statusForIndex = (idx: number): DayStatus =>
    itemCompleted(items[idx]) ? "completed" : "current";

  const canOpen = (_idx: number) => true;

  // ---- Popup de conteúdos do tema ----
  const [sheet, setSheet] = useState<SheetTarget | null>(null);
  const [sheetView, setSheetView] = useState<"options" | "mission">("options");
  const [tick, setTick] = useState(0);
  useScrollLock(!!sheet);
  useEffect(() => {
    if (!sheet || sheetView !== "mission") return;
    const t = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, [sheet, sheetView]);

  const openSheet = (target: SheetTarget) => {
    setSheetView("options");
    setSheet(target);
  };
  const closeSheet = () => {
    setSheet(null);
    setSheetView("options");
  };

  const missaoKeys = (it: JornadaItem) => {
    const pos = it.posicao_original ?? it.seq;
    return {
      done: `${journeyKey}missao_semana_${pos}`,
      start: `${journeyKey}missao_iniciada_semana_${pos}`,
    };
  };

  const openMission = async (it: JornadaItem) => {
    if (!ensureContentAccess({ source: "missao" })) return;
    setSheetView("mission");
    const keys = missaoKeys(it);
    if (!trackingData?.some((t) => t.interaction_type === keys.start)) {
      try {
        await startTracking({ interactionType: keys.start });
      } catch (e) {
        console.error("Erro ao iniciar missão:", e);
      }
    }
  };

  const openMissionChat = (it: JornadaItem) => {
    navigate("/chat", {
      state: {
        mission: {
          habitoId: it.id,
          habitoTitulo: it.habito_titulo,
          explicacaoDesafio: it.explicacao_missao || DEFAULT_MISSAO_TEXT,
          objetivoChatMissao: it.objetivo_chat_missao ?? "",
          interactionType: missaoKeys(it).done,
        },
      },
    });
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
              {isAbstinencia ? "Sua jornada de Liberdade" : "Sua jornada de Redução"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 text-balance">
              {isAbstinencia
                ? "Aprenda a lidar com a vontade de fumar, supere antigos gatilhos e fortaleça sua vida sem cigarro."
                : "Enfraqueça os hábitos e crenças que te prendem ao cigarro. Prepare-se para parar no seu tempo."}
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
              return items.map((it, i) => (
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
                  isFocus={i === focusIndex}
                  onOpen={() => openSheet({ kind: "journey", idx: i })}
                />
              ));
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
                  status={
                    isFinished(`video_apoio_${h.id}`) || isFinished(`hipnose_apoio_${h.id}`)
                      ? "completed"
                      : "current"
                  }
                  onOpen={() => openSheet({ kind: "extra", h })}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <BottomNav />

      {sheet &&
        (() => {
          if (sheet.kind === "journey") {
            const idx = sheet.idx;
            const it = items[idx];
            if (!it) return null;
            const mKeys = missaoKeys(it);
            const missaoDone = isFinished(mKeys.done);
            const startTrack = trackingData?.find((t) => t.interaction_type === mKeys.start);
            const unlockAt = startTrack
              ? new Date(startTrack.started_at).getTime() + MISSAO_LOCK_MS
              : null;
            void tick;
            const msLeft = unlockAt ? unlockAt - Date.now() : 0;
            const missaoLocked = !isAdmin && !!unlockAt && msLeft > 0;
            const countdown = missaoLocked
              ? `${String(Math.floor(msLeft / 3_600_000)).padStart(2, "0")}h ${String(
                  Math.floor((msLeft % 3_600_000) / 60_000),
                ).padStart(2, "0")}m ${String(Math.floor((msLeft % 60_000) / 1000)).padStart(2, "0")}s`
              : null;

            const options: SheetOption[] = [
              it.hasHipnose && {
                key: "hipnose",
                image: stepHipnoseImg,
                title: "Transforme",
                subtitle: "seus hábitos com Hipnose",
                done: isFinished(interactionKey(it, "hypnosis")),
                onClick: () => {
                  closeSheet();
                  openMedia(idx, "hypnosis");
                },
              },
              it.hasMissao && {
                key: "missao",
                image: stepMissaoImg,
                title: "Experimente",
                subtitle: "uma nova vida mais leve",
                done: missaoDone,
                onClick: () => openMission(it),
              },
              {
                key: "mural",
                image: stepMuralImg,
                title: "Compartilhe",
                subtitle: "sua jornada com outras pessoas",
                done: false,
                onClick: () => {
                  closeSheet();
                  openMural(idx);
                },
              },
            ].filter(Boolean) as SheetOption[];

            return (
              <ThemeSheet
                title={it.habito_titulo}
                subtitle={it.subtitulo_habito}
                imagemNome={it.imagem_nome}
                onClose={closeSheet}
                onBack={sheetView === "mission" ? () => setSheetView("options") : undefined}
              >
                {sheetView === "mission" ? (
                  <MissionView
                    text={it.explicacao_missao || DEFAULT_MISSAO_TEXT}
                    done={missaoDone}
                    locked={missaoLocked}
                    countdown={countdown}
                    onLater={closeSheet}
                    onChat={() => openMissionChat(it)}
                  />
                ) : (
                  <SheetOptions options={options} />
                )}
              </ThemeSheet>
            );
          }

          const h = sheet.h;
          const hasH = h.hipnose !== false && !!h.hipnose_nome?.trim();
          const options: SheetOption[] = [
            hasH && {
              key: "hipnose",
              image: stepHipnoseImg,
              title: "Transforme",
              subtitle: "seus hábitos com Hipnose",
              done: isFinished(`hipnose_apoio_${h.id}`),
              onClick: () => {
                closeSheet();
                openMediaReducao(h, "hypnosis");
              },
            },
            {
              key: "mural",
              image: stepMuralImg,
              title: "Compartilhe",
              subtitle: "sua jornada com outras pessoas",
              done: false,
              onClick: () => {
                closeSheet();
                navigate(`/mural?tema=${encodeURIComponent(h.habito_titulo)}`);
              },
            },
          ].filter(Boolean) as SheetOption[];
          return (
            <ThemeSheet
              title={h.habito_titulo}
              subtitle={h.subtitulo_habito ?? null}
              imagemNome={h.imagem_nome ?? null}
              onClose={closeSheet}
            >
              <SheetOptions options={options} />
            </ThemeSheet>
          );
        })()}

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
  onOpen,
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
  onOpen: () => void;
}) {
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

        <button
          type="button"
          onClick={onOpen}
          className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl px-2 py-1.5 text-left transition-transform active:scale-[0.98] ${cardClass}`}
        >
          <ThemeThumb
            imagemNome={imagemNome}
            isLocked={false}
            sizeClass={isFocus ? "h-16 w-16" : "h-14 w-14"}
          />
          <div className="min-w-0 flex-1">
            {isFocus && (
              <span className="mb-0.5 inline-flex rounded-md bg-[hsl(258_80%_92%)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[hsl(258_60%_45%)]">
                Seu foco atual
              </span>
            )}
            <p className="text-balance text-sm font-semibold leading-tight text-foreground">
              {title}
            </p>
            {subtitle && (
              <p className="mt-0.5 text-balance text-[11px] leading-snug text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/50" aria-hidden />
        </button>
      </div>
    </div>
  );
}

type SheetOption = {
  key: string;
  image: string;
  title: string;
  subtitle: string;
  done: boolean;
  onClick: () => void;
};

function ThemeSheet({
  title,
  subtitle,
  imagemNome,
  onClose,
  onBack,
  children,
}: {
  title: string;
  subtitle: string | null;
  imagemNome: string | null;
  onClose: () => void;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[hsl(258_40%_10%/0.55)] px-3 pb-[max(env(safe-area-inset-bottom),16px)] pt-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[88dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-3xl bg-white shadow-[0_24px_70px_-22px_hsl(258_70%_35%/0.55)] animate-in fade-in-0 slide-in-from-bottom-6 duration-200"
      >
        <div className="flex items-center gap-3 bg-gradient-to-br from-[hsl(258_80%_97%)] to-[hsl(220_85%_97%)] px-4 pb-4 pt-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Voltar"
              className="-ml-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/90 text-foreground/70 shadow-sm ring-1 ring-black/[0.05] active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <ThemeThumb imagemNome={imagemNome} isLocked={false} sizeClass="h-16 w-16" />
          <div className="min-w-0 flex-1 pr-9">
            <h2 className="text-balance text-base font-bold leading-tight text-[hsl(var(--electric-blue))]">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-balance text-xs leading-relaxed text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-foreground/70 shadow-sm ring-1 ring-black/[0.05] active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SheetOptions({ options }: { options: SheetOption[] }) {
  return (
    <div className="space-y-2 px-4 pb-5 pt-4">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={o.onClick}
          className="flex w-full items-center gap-3 rounded-2xl bg-[hsl(225_60%_97.5%)] px-3 py-2 text-left ring-1 ring-[hsl(225_40%_92%)] transition-transform active:scale-[0.98]"
        >
          <div className="relative h-14 w-14 flex-shrink-0">
            <img src={o.image} alt="" className="h-14 w-14 object-contain" draggable={false} />
            {o.done && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--electric-blue))] to-[hsl(var(--lilac))] text-white shadow-sm ring-2 ring-white">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight text-foreground">{o.title}</p>
            <p className="mt-0.5 text-balance text-xs leading-snug text-muted-foreground">{o.subtitle}</p>
          </div>
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/50" aria-hidden />
        </button>
      ))}
    </div>
  );
}

function MissionView({
  text,
  done,
  locked,
  countdown,
  onLater,
  onChat,
}: {
  text: string;
  done: boolean;
  locked: boolean;
  countdown: string | null;
  onLater: () => void;
  onChat: () => void;
}) {
  return (
    <div className="px-4 pb-5 pt-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[hsl(258_50%_55%)]">
        Sua missão
      </p>
      <div className="mt-2 rounded-2xl bg-[hsl(258_80%_97%)] px-4 py-4 ring-1 ring-[hsl(258_70%_92%)]">
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/85">{text}</p>
      </div>
      <div className="mt-4 space-y-2">
        <button
          type="button"
          onClick={onLater}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[hsl(258_60%_42%)] shadow-sm ring-1 ring-[hsl(258_70%_88%)] transition-transform active:scale-[0.98]"
        >
          Ainda vou viver essa missão
        </button>
        <button
          type="button"
          onClick={onChat}
          disabled={locked || done}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[hsl(220_90%_55%)] to-[hsl(258_70%_55%)] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_28px_-12px_hsl(258_70%_40%/0.7)] transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
        >
          {done ? (
            <>
              <Check className="h-4 w-4" strokeWidth={3} />
              Missão concluída
            </>
          ) : locked ? (
            <>
              <Lock className="h-4 w-4" />
              Disponível em {countdown}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Concluir a missão
            </>
          )}
        </button>
      </div>
      {locked && !done && (
        <p className="mt-3 text-balance text-center text-[11px] leading-relaxed text-muted-foreground">
          Viva sua missão por 24 horas. Depois desse período, você poderá conversar com o chat sobre a experiência.
        </p>
      )}
    </div>
  );
}
