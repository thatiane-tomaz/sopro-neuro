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
import { hypnosisSampleId, missionSampleId, videoSampleId } from "@/lib/freeSamples";
import { useContentTracking } from "@/hooks/useContentTracking";
import { useScrollLock } from "@/hooks/useScrollLock";
import { supabase } from "@/integrations/supabase/client";
import { getSignedMediaUrl } from "@/lib/mediaUrl";
import { useThemeImage } from "@/hooks/useThemeImage";
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
import MissionDialog from "@/components/MissionDialog";
import JourneyRail from "@/components/JourneyRail";
import { getMissionCopy, shouldOpenMissionAfterHypnosis } from "@/lib/mission";
import MediaPlayer from "@/components/MediaPlayer";
import WaveBackground from "@/components/home/WaveBackground";
import BottomNav from "@/components/home/BottomNav";
import PageLoader from "@/components/home/PageLoader";
import { getStartHereVideoUrl } from "@/lib/startHereVideo";
import soproLogo from "@/assets/sopro-logo.webp";
import stepHipnoseImg from "@/assets/step-hipnose.webp";
import stepMissaoImg from "@/assets/step-missao.webp";
import stepMuralImg from "@/assets/step-mural.webp";
import stepVideoImg from "@/assets/step-video.png";
import { performLogout } from "@/lib/logout";
import { useAllJourneyTemas, useJourneyFocos } from "@/hooks/useJourneyFocos";
import { useJourneyChoice } from "@/hooks/useJourneyChoice";
import { JOURNEY_IDS, journeyPrefix, type JourneyId } from "@/lib/journeyFocus";
import { JOURNEYS, isJourneyContentCompleted, journeyVideoBucket } from "@/lib/journeys";

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
  hasMural: boolean;
  posicao_original: number | null;
  video_nome: string | null;
  hipnose_nome: string | null;
  imagem_nome: string | null;
  explicacao_missao: string | null;
  missao_principal: string | null;
  missao_secundaria: string | null;
  objetivo_chat_missao: string | null;
  hasVideo: boolean;
  hasHipnose: boolean;
  isIntro: boolean;
  isSelected: boolean;
  journey: JourneyId;
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


  // Todas as jornadas aparecem juntas, na ordem do catálogo.
  const { temas, isLoading: temasLoading } = useAllJourneyTemas();
  const { chooseJourney } = useJourneyChoice();
  const { focoAtual } = useJourneyFocos();
  const items = useMemo<JornadaItem[]>(
    () =>
      JOURNEY_IDS.flatMap((j) =>
        temas[j].map((f, i) => ({
          id: f.id,
          seq: i + 1,
          habito_titulo: f.habito_titulo,
          subtitulo_habito: f.subtitulo_habito,
          hasMissao: f.hasMissao,
          hasMural: f.hasMural,
          posicao_original: f.posicao,
          video_nome: f.video_nome,
          hipnose_nome: f.hipnose_nome,
          imagem_nome: f.imagem_nome,
          explicacao_missao: f.explicacao_missao,
          missao_principal: f.missao_principal,
          missao_secundaria: f.missao_secundaria,
          objetivo_chat_missao: f.objetivo_chat_missao,
          hasVideo: f.hasVideo,
          hasHipnose: f.hasHipnose,
          isIntro: f.tema_fixo,
          isSelected: f.isSelected,
          journey: j,
        })),
      ),
    [temas],
  );

  // ---- Progress helpers ----
  const isFinished = (interactionType: string) =>
    !!trackingData?.some((t) => t.interaction_type === interactionType && t.finished_at !== null);

  // Chaves de progresso compartilhadas com o Dashboard: prefixo da jornada do
  // tema + posição original do tema em habitos_jornada.
  const interactionKey = (it: JornadaItem, type: "video" | "hypnosis") => {
    const pos = it.posicao_original ?? it.seq;
    const journeyKey = journeyPrefix(it.journey);
    return type === "video"
      ? `${journeyKey}video_semana_${pos}`
      : `${journeyKey}hipnose_semana_${pos}`;
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
  const itemCompleted = (it: JornadaItem) => isJourneyContentCompleted(it, {
    video: isFinished(interactionKey(it, "video")),
    hipnose: isFinished(interactionKey(it, "hypnosis")),
    missao: isFinished(missaoKeys(it).done),
  });

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
    if (target.kind === "journey" && items[target.idx]?.journey === "ultimo_cigarro") {
      void chooseJourney("ultimo_cigarro");
    }
  };
  const closeSheet = () => {
    setSheet(null);
    setSheetView("options");
  };

  const missaoKeys = (it: JornadaItem) => {
    const pos = it.posicao_original ?? it.seq;
    const journeyKey = journeyPrefix(it.journey);
    return {
      done: `${journeyKey}missao_semana_${pos}`,
      start: `${journeyKey}missao_iniciada_semana_${pos}`,
    };
  };

  const openMission = async (it: JornadaItem) => {
    if (
      !ensureContentAccess({
        source: "missao",
        sample: { kind: "neo", id: missionSampleId(it.id) },
        claim: false,
      })
    )
      return;
    void chooseJourney(it.journey);
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
          explicacaoDesafio: getMissionCopy(it).full,
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
    const bucket = type === "video" ? journeyVideoBucket(it.journey) : "hipnoses_2";
    const fileName = type === "video" ? it.video_nome : it.hipnose_nome;
    return getSignedMediaUrl(bucket, fileName, type, type === "video" ? ["videos"] : ["hypnosis"]);
  };

  const openMedia = async (idx: number, type: "video" | "hypnosis") => {
    const it = items[idx];
    if (!it) return;
    // Sem assinatura: 1 hipnose e 1 explicação grátis (a primeira que abrir)
    const sample =
      type === "video"
        ? { kind: "explicacao" as const, id: videoSampleId(it.video_nome) }
        : { kind: "hipnose" as const, id: hypnosisSampleId(it.hipnose_nome) };
    if (!ensureContentAccess({ source: type, sample })) return;
    void chooseJourney(it.journey);
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
      missionItemId: it.id,
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
    temasLoading
  ) {
    return <PageLoader />;
  }
  if (!user) return <Navigate to="/login" replace />;


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
              <p className="text-sm text-muted-foreground leading-tight font-medium">
                Seu cérebro está aprendendo<br />uma nova forma de viver.
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-10 w-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-[0_4px_14px_-4px_hsl(220_40%_40%/0.18)] ring-1 ring-black/[0.03]">
                  <User className="h-5 w-5 text-primary" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border-0 shadow-primary">
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
          <h1 className="text-xl font-bold bg-gradient-to-r from-[hsl(220_90%_55%)] to-[hsl(230_90%_45%)] bg-clip-text text-transparent">
            Escolha a sua jornada
          </h1>
          <p className="text-sm font-medium leading-snug text-muted-foreground mt-1 text-balance">
            Jornadas criadas a partir dos seus gatilhos.
          </p>
        </div>

        {items.length === 0 ? (
          <p className="mt-8 text-center text-sm font-medium text-muted-foreground">
            Complete o onboarding para ver seus temas.
          </p>
        ) : (
          JOURNEYS.map((j) => {
            const list = items
              .map((it, idx) => ({ it, idx }))
              .filter(({ it }) => it.journey === j.id);
            if (list.length === 0) return null;
            const concluidos = list.filter(({ it }) => itemCompleted(it)).length;
            return (
              <section key={j.id} className="mt-6">
                <div>
                  <h2 className="flex items-center justify-between gap-2 text-lg font-bold leading-tight text-[hsl(var(--electric-blue))]">
                    <span className="text-balance">{j.title}</span>
                    <span className="shrink-0 rounded-full bg-lilac-soft px-2.5 py-0.5 text-sm font-bold tabular-nums text-[hsl(var(--electric-blue))]">
                      {concluidos}/{list.length}
                    </span>
                  </h2>
                  <p className="mt-0.5 text-sm font-medium leading-snug text-muted-foreground text-balance">
                    {j.subtitle}
                  </p>
                </div>
                <JourneyRail label={j.title}>
                  {list.map(({ it, idx }, i) => (
                    <ThemeCard
                      key={it.id}
                      title={it.habito_titulo}
                      subtitle={it.subtitulo_habito}
                      imagemNome={it.imagem_nome}
                      blankImage={it.journey === "ultimo_cigarro"}
                      completed={statusForIndex(idx) === "completed"}
                      isFocus={focoAtual?.id === it.id}
                      position={i + 1}
                      onOpen={() => openSheet({ kind: "journey", idx })}
                    />
                  ))}
                </JourneyRail>
              </section>
            );
          })
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
              it.hasVideo && {
                key: "video",
                stepName: "Vídeo",
                image: stepVideoImg,
                title: "Entenda",
                subtitle: "o que o vício faz",
                done: isFinished(interactionKey(it, "video")),
                onClick: () => {
                  closeSheet();
                  openMedia(idx, "video");
                },
              },
              it.hasHipnose && {
                key: "hipnose",
                stepName: "Hipnose",
                image: stepHipnoseImg,
                title: it.journey === "ultimo_cigarro" ? "Enfraqueça" : "Transforme",
                subtitle: it.journey === "ultimo_cigarro" ? "as crenças que te prendem" : "seus hábitos com Hipnose",
                done: isFinished(interactionKey(it, "hypnosis")),
                onClick: () => {
                  closeSheet();
                  openMedia(idx, "hypnosis");
                },
              },
              it.hasMissao && {
                key: "missao",
                stepName: "Missão",
                image: stepMissaoImg,
                title: "Experimente",
                subtitle: "uma nova vida mais leve",
                done: missaoDone,
                onClick: () => openMission(it),
              },
              it.hasMural && {
                key: "mural",
                stepName: "Mural",
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

            if (sheetView === "mission") {
              const copy = getMissionCopy(it);
              return <MissionDialog open title={it.habito_titulo} primary={copy.primary} secondary={copy.secondary}
                done={missaoDone} locked={missaoLocked} countdown={countdown}
                onClose={closeSheet} onChat={() => openMissionChat(it)} />;
            }
            return (
              <ThemeSheet title={it.habito_titulo} subtitle={it.subtitulo_habito}
                imagemNome={it.imagem_nome} blankImage={it.journey === "ultimo_cigarro"} onClose={closeSheet}>
                <SheetOptions options={options} />
              </ThemeSheet>
            );
          }

          return null;
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
          onPlaybackEnded={() => {
            const idx = items.findIndex((it) => it.id === selectedMedia.missionItemId);
            const it = items[idx];
            if (!it || !shouldOpenMissionAfterHypnosis(selectedMedia.contentType, true, it.hasMissao)) return;
            setSelectedMedia(null);
            setTrackingId(null);
            setSheet({ kind: "journey", idx });
            void openMission(it);
          }}
        />
      )}

    </div>
  );
}

/* ---------- Sub-components ---------- */

function ThemeCard({
  title,
  subtitle,
  imagemNome,
  blankImage = false,
  completed,
  isFocus,
  position,
  onOpen,
}: {
  title: string;
  subtitle: string | null;
  imagemNome: string | null;
  blankImage?: boolean;
  completed: boolean;
  isFocus: boolean;
  position: number;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`relative flex w-[74%] min-w-[240px] max-w-[300px] flex-shrink-0 snap-start flex-col overflow-hidden rounded-3xl text-left transition-transform active:scale-[0.98] ${
        isFocus
          ? "bg-gradient-to-br from-[hsl(258_85%_96%)] to-[hsl(228_85%_96%)] shadow-primary"
          : "bg-card/90 shadow-surface"
      }`}
    >
      <div className="p-2 pb-0">
        <div className="relative">
          {blankImage ? (
            <div aria-hidden className="aspect-[4/3] w-full rounded-xl bg-background" />
          ) : (
            <ThemeThumb imagemNome={imagemNome} isLocked={false} sizeClass="aspect-[4/3] w-full" />
          )}
          <span
            aria-hidden
            className="absolute left-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-white/75 px-1 text-sm font-semibold leading-none tabular-nums text-[hsl(var(--electric-blue))] opacity-90 backdrop-blur-[2px]"
          >
            {position}
          </span>
        </div>
      </div>
      {completed && (
        <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--electric-blue))] to-[hsl(var(--lilac))] text-white shadow-sm">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
      )}
      <div className="flex flex-1 flex-col px-3 pb-3 pt-2">
        {isFocus && (
          <span className="mb-1 inline-flex self-start rounded-md bg-[hsl(258_80%_92%)] px-1.5 py-px text-sm font-semibold leading-tight text-[hsl(258_60%_45%)]">
            Foco de hoje
          </span>
        )}
        <p className="text-balance text-base font-semibold leading-tight text-foreground">{title}</p>
        {subtitle && (
          <p className="mt-1 text-balance text-sm font-medium leading-snug text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </button>
  );
}

function ThemeThumb({
  imagemNome,
  isLocked,
  sizeClass,
}: {
  imagemNome: string | null;
  isLocked: boolean;
  sizeClass: string;
}) {
  const { src, failed, onError } = useThemeImage(imagemNome, 200);

  if (!src || failed) {
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
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={onError}
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
          className="h-6 w-6 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm ring-2 ring-[hsl(258_80%_92%)]"
          style={{ background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})` }}
        >
          {seq}
        </div>
      );
    }
    return (
      <div className="h-5 w-5 rounded-full flex items-center justify-center text-[hsl(220_20%_55%)] text-sm font-semibold bg-muted shadow-surface">
        {seq}
      </div>
    );
  })();

  const lineColor = isCompleted ? accentTo : "hsl(220, 30%, 90%)";

  const cardClass = isFocus
    ? "bg-gradient-to-br from-[hsl(258_85%_96%)] to-[hsl(228_85%_96%)] shadow-primary"
    : "bg-[hsl(225_60%_97.5%)] shadow-surface";

  return (
    <div>
      {label && (
        <p className={`px-1 pb-1 text-sm font-medium text-muted-foreground ${isFirst ? "" : "pt-2.5"}`}>
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
              <span className="mb-1 inline-flex rounded-md bg-[hsl(258_80%_92%)] px-1.5 py-px text-sm font-semibold leading-tight text-[hsl(258_60%_45%)]">
                Seu foco atual
              </span>
            )}
            <p className="text-balance text-sm font-semibold leading-tight text-foreground">
              {title}
            </p>
            {subtitle && (
              <p className="mt-0.5 text-balance text-sm leading-snug text-muted-foreground font-medium">
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
  /** Nome do passo do método: "Hipnose", "Missão", "Mural". */
  stepName: string;
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
  blankImage = false,
  onClose,
  onBack,
  children,
}: {
  title: string;
  subtitle: string | null;
  imagemNome: string | null;
  blankImage?: boolean;
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
          {blankImage ? (
            <div aria-hidden className="h-16 w-16 shrink-0 rounded-xl bg-background" />
          ) : (
            <ThemeThumb imagemNome={imagemNome} isLocked={false} sizeClass="h-16 w-16" />
          )}
          <div className="min-w-0 flex-1 pr-9">
            <h2 className="text-balance text-base font-bold leading-tight text-[hsl(var(--electric-blue))]">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-balance text-sm leading-relaxed text-muted-foreground font-medium">
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
      {options.map((o, index) => (
        <button
          key={o.key}
          type="button"
          onClick={o.onClick}
          className="flex w-full items-center gap-3 rounded-2xl bg-[hsl(225_60%_97.5%)] px-3 py-2 text-left shadow-surface transition-transform active:scale-[0.98]"
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
            <p className="text-sm font-bold uppercase tracking-wide text-[hsl(var(--lilac))]">
              Passo {index + 1} · {o.stepName}
            </p>
            <p className="mt-0.5 text-sm font-semibold leading-tight text-foreground">{o.title}</p>
            <p className="mt-0.5 text-balance text-sm leading-snug text-muted-foreground font-medium">{o.subtitle}</p>
          </div>
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/50" aria-hidden />
        </button>
      ))}
    </div>
  );
}

