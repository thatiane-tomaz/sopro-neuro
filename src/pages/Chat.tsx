import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, X, Send, Loader2, Mic, Square, Volume2, VolumeX } from "lucide-react";
import ReactMarkdown from "react-markdown";
import WaveBackground from "@/components/home/WaveBackground";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsFreelist } from "@/hooks/useIsFreelist";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useJourneyTracking } from "@/hooks/useJourneyTracking";
import { useBrainSparks } from "@/hooks/useBrainSparks";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  let session = data.session;
  const expiresAt = session?.expires_at ? session.expires_at * 1000 : 0;
  // Refresh proactively: stale tokens in the native webview caused 401s on the chat function.
  if (!session?.access_token || expiresAt - Date.now() < 60_000) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    if (refreshed.session?.access_token) session = refreshed.session;
  }
  if (!session?.access_token) return "";

  // Validate against the auth server: a locally stored token can reference a
  // session that no longer exists (session_not_found), which the server rejects.
  const { error } = await supabase.auth.getUser(session.access_token);
  if (error) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (!refreshError && refreshed.session?.access_token) return refreshed.session.access_token;
    return "";
  }
  return session.access_token;
}


import brainDefault from "@/assets/brain/neo.webp";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Msg = { role: "user" | "assistant"; content: string };

type MissionContext = {
  habitoId: string;
  habitoTitulo: string;
  explicacaoDesafio: string;
  objetivoChatMissao?: string | null;
  interactionType: string;
};

const MISSION_END_RE = /\[MISSION_END\](\{[\s\S]*?\})\[\/MISSION_END\]/;
const RETORNO_END_RE = /\[RETORNO_END\](\{[\s\S]*?\})\[\/RETORNO_END\]/;

const SUGGESTIONS_PHASE_1 = [
  "Por que desta vez será mais fácil? 🌟",
  "Não estou muito motivado, me ajude 💜",
  "O que a nicotina faz no meu cérebro? 🧠",
  "Pausa para refletir 💭",
];

const SUGGESTIONS_PHASE_2 = [
  "Tô com vontade de fumar agora, me ajude 💪",
  "Me sinto estressado e sem paciência 🌿",
  "Quando a vontade vai passar? 🌤️",
  "Pausa para refletir 💭",
];

interface ChatProps {
  /** Renders the chat to fill its parent (modal) instead of the full viewport. */
  embedded?: boolean;
  /** Message sent automatically as soon as the chat opens. */
  initialMessage?: string;
  /** Neo's opening line, so it matches the hook shown before the chat opened. */
  greetingText?: string;
  /** Called when the user closes an embedded chat. */
  onClose?: () => void;
  /** Revisão de gatilhos: usuário concluiu todos os focos da jornada de redução. */
  revisao?: {
    habitos: Array<{ titulo: string; tema_fixo: boolean }>;
    habitosConcluidos?: string[];
    gatilhosAnteriores?: string[];
  };
}

export default function Chat({ embedded = false, initialMessage, greetingText, onClose, revisao: revisaoProp }: ChatProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const mission = (location.state as any)?.mission as MissionContext | undefined;
  const retorno = (location.state as any)?.retorno as
    | {
        habitos: Array<{ titulo: string; tema_fixo: boolean }>;
        habitosJaCompletadosCount?: number;
        gatilhosAnteriores?: string[];
      }
    | undefined;
  const revisao =
    revisaoProp ??
    ((location.state as any)?.revisao as
      | {
          habitos: Array<{ titulo: string; tema_fixo: boolean }>;
          habitosConcluidos?: string[];
          gatilhosAnteriores?: string[];
        }
      | undefined);
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { profile } = useUserProfile();
  const { isPremium, loading: subLoading } = useSubscription();
  const { isFreelist, loading: freelistLoading } = useIsFreelist();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { getCurrentDay, startTracking, updateProgress } = useJourneyTracking();
  const { award } = useBrainSparks();
  const { toast } = useToast();

  const currentDay = getCurrentDay();
  const SUGGESTIONS = mission || retorno || revisao
    ? []
    : [
        ...(currentDay <= 7 ? SUGGESTIONS_PHASE_1 : SUGGESTIONS_PHASE_2),
      ];

  const firstName = (profile?.display_name || "").split(" ")[0] || "";
  const greeting = retorno
    ? `Oi${firstName ? `, ${firstName}` : ""}. Que bom que você está aqui.\n\nVoltar não é recomeçar do zero, é ajustar a rota. Em uns 5 minutinhos vou te fazer algumas perguntas curtas pra entender quais gatilhos estão te puxando de volta ao cigarro agora, e assim montar uma jornada de redução mais alinhada com esse momento.\n\nPra começar: o que você acha que mais te levou a voltar a fumar?`
    : revisao
    ? `Parabéns${firstName ? `, ${firstName}` : ""}! Você concluiu todos os focos da sua jornada. 💜\n\nVamos rever seus gatilhos? Em uns 5 minutinhos vou te fazer algumas perguntas curtas pra entender quais gatilhos continuam fortes hoje, e com isso montar sua próxima jornada.\n\nPra começar: como você está em relação ao cigarro agora, depois de tudo o que já trabalhou?`
    : mission
    ? `Oi${firstName ? `, ${firstName}` : ""}!\n\nAntes de continuarmos, só siga essa conversa se você realmente viveu a missão. Se ainda não viveu, feche essa tela e volte quando tiver experimentado, assim eu consigo te ajudar de verdade.\n\nSua missão foi: ${mission.explicacaoDesafio}\n\nSe você já viveu, me conte como foi a sua experiência.`
    : `Oi${firstName ? `, ${firstName}` : ""}! Tô aqui com você.\n\nMe conta o que está passando aí ou me faça a pergunta que quiser sobre parar de fumar. Pode escrever abaixo.`;

  // When the user arrives with a question already written/selected on the
  // Dashboard, the conversation starts with that message (no Neo greeting).
  const [messages, setMessages] = useState<Msg[]>(
    initialMessage?.trim() ? [] : [{ role: "assistant", content: greeting }],
  );
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [missionCompleted, setMissionCompleted] = useState(false);
  const [pendingMissionEnd, setPendingMissionEnd] = useState<
    | {
        parsed: { performance?: string; resumo_mural?: string; consentiu_postar?: boolean };
        transcript: Msg[];
      }
    | null
  >(null);
  const [retornoFinalizando, setRetornoFinalizando] = useState(false);
  const [pendingRetornoEnd, setPendingRetornoEnd] = useState<{ habitos_titulos?: string[] } | null>(
    null,
  );
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const spokenRef = useRef<Set<number>>(new Set());

  const finalizeMission = async (
    parsed: { performance?: string; resumo_mural?: string; consentiu_postar?: boolean },
    transcript: Msg[],
  ) => {
    if (!user || !mission || missionCompleted) return;
    setMissionCompleted(true);
    try {
      // Save mission result
      await (supabase as any).from("resultado_missao_usuario").insert({
        user_id: user.id,
        habito_id: mission.habitoId,
        performance: parsed.performance ?? null,
        resumo_mural: parsed.resumo_mural ?? null,
        consentiu_postar: !!parsed.consentiu_postar,
        postado_no_mural: !!parsed.consentiu_postar,
        transcript,
      });
      // Mark mission finished in journey_tracking
      const r = await startTracking({ interactionType: mission.interactionType });
      if (r?.id) {
        updateProgress({ trackingId: r.id, progressPercentage: 100, finished: true });
      }
      award(parsed.consentiu_postar ? "mission_completed_with_mural_post" : "mission_completed", {
        habito_id: mission.habitoId,
      });
      toast({ title: "Missão concluída! 🎉" });
      setTimeout(() => navigate("/dashboard"), 2500);
    } catch (e) {
      console.error("finalize mission error:", e);
    }
  };

  const finalizeRetorno = async (parsed: { habitos_titulos?: string[] }) => {
    if (!user || retornoFinalizando) return;
    setRetornoFinalizando(true);
    try {
      const titulos = Array.isArray(parsed.habitos_titulos)
        ? parsed.habitos_titulos.filter((t) => typeof t === "string" && t.trim())
        : [];
      await (supabase as any).from("historico_jornada_usuario").insert({
        user_id: user.id,
        jornada: "reducao",
        habitos_selecionados: titulos,
      });
      if (!revisao) {
        // Voltando a fumar: limpa a data do último cigarro para que o usuário
        // possa marcar um novo momento de parada na jornada de redução.
        await (supabase as any)
          .from("onboarding_responses")
          .update({ last_cigarette_date: null })
          .eq("user_id", user.id);
      }
      await queryClient.invalidateQueries({ queryKey: ["onboarding_response"] });
      await queryClient.invalidateQueries({ queryKey: ["jornada-type"] });
      await queryClient.invalidateQueries({ queryKey: ["gatilho-jornada"] });
      await queryClient.invalidateQueries({ queryKey: ["historico-jornada"] });
      await queryClient.invalidateQueries({ queryKey: ["habitos-jornada"] });
      await queryClient.invalidateQueries({ queryKey: ["journey-start"] });
      await queryClient.invalidateQueries({ queryKey: ["journey-tracking"] });
      await queryClient.invalidateQueries({ queryKey: ["journey-review"] });
      toast({ title: "Jornada atualizada", description: "Sua nova rota de redução está pronta." });
      if (embedded && onClose) {
        onClose();
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (e) {
      console.error("finalize retorno error:", e);
      setRetornoFinalizando(false);
    }
  };

  const sendRef = useRef<((text: string) => void) | null>(null);
  const autoSentRef = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  // Send the message typed on the Dashboard as soon as the chat is ready.
  useEffect(() => {
    const text = initialMessage?.trim();
    if (!text || autoSentRef.current) return;
    if (authLoading || subLoading || freelistLoading || adminLoading) return;
    autoSentRef.current = true;
    const id = setTimeout(() => sendRef.current?.(text), 60);
    return () => clearTimeout(id);
  }, [initialMessage, authLoading, subLoading, freelistLoading, adminLoading]);

  useEffect(() => () => abortRef.current?.abort(), []);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (subLoading || freelistLoading || adminLoading) return null;
  if (!isAdmin && !isFreelist && !isPremium) return <Navigate to="/paywall" replace />;

  const speak = async (text: string) => {
    if (!voiceEnabled || !text.trim()) return;
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getAccessToken()}`,
        },
        body: JSON.stringify({ text }),
      });
      if (!resp.ok) return;
      const { audioContent } = await resp.json();
      if (!audioContent) return;
      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current = null;
      }
      const audio = new Audio(`data:audio/mpeg;base64,${audioContent}`);
      audioElRef.current = audio;
      audio.play().catch(() => {});
    } catch (e) {
      console.error("TTS error", e);
    }
  };

  const handleSpeakerClick = (text: string) => {
    if (voiceEnabled) {
      // Disable: stop any audio and turn off autoplay
      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current = null;
      }
      setVoiceEnabled(false);
    } else {
      // Enable: turn on autoplay and speak current message
      setVoiceEnabled(true);
      // Inline speak (bypass voiceEnabled state-not-yet-updated)
      (async () => {
        try {
          const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${await getAccessToken()}`,
            },
            body: JSON.stringify({ text }),
          });
          if (!resp.ok) return;
          const { audioContent } = await resp.json();
          if (!audioContent) return;
          if (audioElRef.current) {
            audioElRef.current.pause();
            audioElRef.current = null;
          }
          const audio = new Audio(`data:audio/mpeg;base64,${audioContent}`);
          audioElRef.current = audio;
          audio.play().catch(() => {});
        } catch (e) {
          console.error("TTS error", e);
        }
      })();
    }
  };

  const startRecording = async () => {
    if (isRecording || isStreaming || isTranscribing) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (blob.size < 500) return;
        setIsTranscribing(true);
        try {
          const buf = await blob.arrayBuffer();
          let binary = "";
          const bytes = new Uint8Array(buf);
          const chunk = 0x8000;
          for (let i = 0; i < bytes.length; i += chunk) {
            binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
          }
          const base64 = btoa(binary);
          const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-to-text`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${await getAccessToken()}`,
            },
            body: JSON.stringify({ audio: base64 }),
          });
          const data = await resp.json();
          const text = (data.text || "").trim();
          if (text) {
            send(text);
          } else {
            toast({ title: "Não consegui ouvir", description: "Tenta falar de novo.", variant: "destructive" });
          }
        } catch (e) {
          console.error(e);
          toast({ title: "Erro ao transcrever", description: "Tenta de novo.", variant: "destructive" });
        } finally {
          setIsTranscribing(false);
        }
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
    } catch (e) {
      console.error(e);
      toast({ title: "Microfone bloqueado", description: "Permita o acesso ao microfone.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    const userMsg: Msg = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setIsStreaming(true);
    // Award daily chat spark (RPC handles once-per-day deduplication)
    if (!mission && !retorno && !revisao) {
      award("chat_message");
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getAccessToken()}`,
        },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
          ...(mission
            ? {
                mission: {
                  habito_titulo: mission.habitoTitulo,
                  explicacao_desafio: mission.explicacaoDesafio,
                  objetivo_chat_missao: mission.objetivoChatMissao ?? "",
                },
              }
            : {}),
          ...(retorno
            ? {
                retorno: {
                  habitos: retorno.habitos,
                  ja_completados: retorno.habitosJaCompletadosCount ?? 0,
                  gatilhos_anteriores: retorno.gatilhosAnteriores ?? [],
                },
              }
            : {}),
          ...(revisao
            ? {
                revisao: {
                  habitos: revisao.habitos,
                  habitos_concluidos: revisao.habitosConcluidos ?? [],
                  gatilhos_anteriores: revisao.gatilhosAnteriores ?? [],
                },
              }
            : {}),
        }),
        signal: controller.signal,
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) {
          toast({ title: "Espera um instante", description: "Muitas mensagens em pouco tempo.", variant: "destructive" });
        } else if (resp.status === 402) {
          toast({ title: "Indisponível agora", description: "Tente novamente em alguns instantes.", variant: "destructive" });
        } else if (resp.status === 401) {
          toast({
            title: "Sua sessão expirou",
            description: "Entre novamente para continuar a conversa.",
            variant: "destructive",
          });
          setMessages((prev) => prev.slice(0, -1));
          setIsStreaming(false);
          try {
            await supabase.auth.signOut();
          } catch {
            // ignore: local storage is cleared by the redirect below anyway
          }
          navigate("/login", { replace: true });
          return;
        } else {
          toast({ title: "Erro", description: "Não consegui responder agora. Tenta de novo?", variant: "destructive" });
        }
        setMessages((prev) => prev.slice(0, -1));
        setIsStreaming(false);
        return;
      }


      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";
      let streamDone = false;

      // Insert empty assistant message to update progressively
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const updateAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const copy = [...prev];
          const cleaned = assistantSoFar
            .replace(MISSION_END_RE, "")
            .replace(RETORNO_END_RE, "")
            .trim();
          copy[copy.length - 1] = { role: "assistant", content: cleaned };
          return copy;
        });
      };

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let nlIdx: number;
        while ((nlIdx = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, nlIdx);
          textBuffer = textBuffer.slice(nlIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) updateAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) updateAssistant(content);
          } catch {}
        }
      }

      // After full response, speak it (once)
      setMessages((prev) => {
        const idx = prev.length - 1;
        const last = prev[idx];
        if (last?.role === "assistant" && last.content && !spokenRef.current.has(idx)) {
          spokenRef.current.add(idx);
          speak(last.content);
        }
        return prev;
      });

      // Mission end detection
      if (mission) {
        const m = assistantSoFar.match(MISSION_END_RE);
        if (m) {
          try {
            const parsed = JSON.parse(m[1]);
            const cleanedContent = assistantSoFar.replace(MISSION_END_RE, "").trim();
            // Strip the tag from the displayed message
            setMessages((prev) => {
              const copy = [...prev];
              const lastIdx = copy.length - 1;
              if (copy[lastIdx]?.role === "assistant") {
                copy[lastIdx] = { role: "assistant", content: cleanedContent };
              }
              return copy;
            });
            const transcript: Msg[] = [
              ...next,
              { role: "assistant", content: cleanedContent },
            ];
            // Show explicit confirmation dialog before finalizing
            setPendingMissionEnd({ parsed, transcript });
          } catch (e) {
            console.error("MISSION_END parse error:", e);
          }
        }
      }

      // Retorno / revisão end detection
      if (retorno || revisao) {
        const r = assistantSoFar.match(RETORNO_END_RE);
        if (r) {
          try {
            const parsed = JSON.parse(r[1]);
            const cleanedContent = assistantSoFar.replace(RETORNO_END_RE, "").trim();
            setMessages((prev) => {
              const copy = [...prev];
              const lastIdx = copy.length - 1;
              if (copy[lastIdx]?.role === "assistant") {
                copy[lastIdx] = { role: "assistant", content: cleanedContent };
              }
              return copy;
            });
            setPendingRetornoEnd(parsed ?? {});
          } catch (e) {
            console.error("RETORNO_END parse error:", e);
          }
        }
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        console.error(e);
        toast({ title: "Erro de conexão", description: "Verifica sua internet.", variant: "destructive" });
        setMessages((prev) => (prev[prev.length - 1]?.role === "assistant" && prev[prev.length - 1].content === "" ? prev.slice(0, -1) : prev));
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  sendRef.current = send;

  return (
    <div
      className={`relative w-full max-w-full overflow-x-hidden overflow-y-hidden flex flex-col ${
        embedded ? "h-full" : "h-[100dvh]"
      }`}
    >
      <WaveBackground />

      {/* Floating back/close button (no full header) */}
      <div className={`absolute left-4 z-20 ${embedded ? "top-0 pt-2" : "top-[env(safe-area-inset-top)] pt-3"}`}>
        <button
          onClick={() => (embedded && onClose ? onClose() : navigate("/dashboard"))}
          aria-label={embedded ? "Fechar" : "Voltar"}
          className="h-10 w-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-[0_4px_14px_-4px_hsl(220_40%_40%/0.18)] ring-1 ring-black/[0.03]"
        >
          {embedded ? <X className="h-5 w-5 text-primary" /> : <ArrowLeft className="h-5 w-5 text-primary" />}
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className={`relative z-10 flex-1 overflow-y-auto px-5 pb-2 ${
          embedded ? "pt-14" : "pt-[calc(env(safe-area-inset-top)+64px)]"
        }`}
      >
        <div className="mx-auto max-w-md space-y-3 py-2">
          {messages.map((m, i) => {
            const lastAssistantIdx = (() => {
              for (let j = messages.length - 1; j >= 0; j--) {
                if (messages[j].role === "assistant" && messages[j].content) return j;
              }
              return -1;
            })();
            const isLastAssistant =
              m.role === "assistant" && i === lastAssistantIdx && !isStreaming;
            return (
              <MessageBubble
                key={i}
                role={m.role}
                content={m.content}
                showBrain={i === 0 && m.role === "assistant"}
                brainSrc={brainDefault}
                showSpeaker={isLastAssistant}
                voiceEnabled={voiceEnabled}
                onSpeakerClick={() => handleSpeakerClick(m.content)}
              />
            );
          })}
          {isStreaming && messages[messages.length - 1]?.content === "" && (
            <div className="flex justify-start items-end gap-2">
              <div className="h-8 w-8 flex-shrink-0 rounded-full bg-white/90 ring-1 ring-[hsl(258_70%_90%)] shadow-[0_4px_12px_-6px_hsl(258_70%_45%/0.35)] flex items-center justify-center overflow-hidden">
                <img src={brainDefault} alt="Neo" className="h-7 w-7 object-contain" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-white/90 backdrop-blur-sm px-4 py-3 shadow-[0_6px_20px_-12px_hsl(258_70%_45%/0.25)] ring-1 ring-black/[0.03]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[hsl(258_60%_55%)] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-[hsl(258_60%_55%)] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-[hsl(258_60%_55%)] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {messages.length === 1 && !isStreaming && (
            <div className="pt-2 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => {
                const isReflect = s.includes("Pausa para refletir");
                return (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className={`text-[11.5px] whitespace-nowrap px-3 py-1.5 rounded-full backdrop-blur-sm ring-1 font-medium shadow-sm active:scale-95 transition-transform ${
                      isReflect
                        ? "bg-[hsl(258_70%_96%)] ring-[hsl(258_70%_85%)] text-[hsl(258_60%_40%)]"
                        : "bg-white/80 ring-[hsl(258_70%_92%)] text-[hsl(258_60%_45%)]"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div
        hidden={!!pendingRetornoEnd}
        className={`relative z-10 px-5 pt-2 bg-gradient-to-t from-white/80 via-white/40 to-transparent ${
          embedded ? "pb-3" : "pb-[max(env(safe-area-inset-bottom),12px)]"
        }`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="mx-auto max-w-md flex items-end gap-2"
        >
          <div className="relative flex-1">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder={isRecording ? "Gravando..." : isTranscribing ? "Transcrevendo..." : "Fala comigo..."}
            rows={1}
            disabled={isStreaming || isRecording || isTranscribing}
            className="w-full resize-none max-h-32 rounded-2xl bg-white pl-4 pr-12 py-3 text-base md:text-sm shadow-[0_8px_22px_-12px_hsl(258_70%_45%/0.25)] ring-1 ring-[hsl(258_70%_92%)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_70%_70%)] placeholder:text-muted-foreground/70"
          />
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isStreaming || isTranscribing}
            aria-label={isRecording ? "Parar gravação" : "Gravar áudio"}
            className={`absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              isRecording
                ? "bg-red-500 text-white animate-pulse"
                : "bg-[hsl(258_70%_95%)] text-[hsl(258_60%_45%)] hover:bg-[hsl(258_70%_90%)]"
            } disabled:opacity-40`}
          >
            {isTranscribing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isRecording ? (
              <Square className="h-4 w-4 fill-current" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>
          </div>
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            aria-label="Enviar"
            className="h-11 w-11 flex-shrink-0 rounded-full bg-gradient-to-br from-[hsl(220_90%_55%)] to-[hsl(258_70%_55%)] text-white flex items-center justify-center shadow-[0_10px_24px_-10px_hsl(258_70%_45%/0.55)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform"
          >
            {isStreaming ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </form>
        <p className="mx-auto max-w-md text-center text-[10px] text-muted-foreground mt-2 px-4">
          Sou seu amigo virtual. Em caso de emergência ou crise, ligue 188 (CVV).
        </p>
      </div>

      {pendingRetornoEnd && (
        <div
          className={`relative z-10 px-5 pt-2 bg-gradient-to-t from-white/85 via-white/45 to-transparent ${
            embedded ? "pb-3" : "pb-[max(env(safe-area-inset-bottom),12px)]"
          }`}
        >
          <div className="mx-auto max-w-md">
            <Button
              disabled={retornoFinalizando}
              onClick={() => {
                const parsed = pendingRetornoEnd;
                setPendingRetornoEnd(null);
                void finalizeRetorno(parsed);
              }}
              className="w-full h-12 rounded-2xl text-white text-base font-bold bg-gradient-to-br from-[hsl(220_90%_55%)] to-[hsl(258_70%_55%)] shadow-[0_12px_28px_-12px_hsl(258_70%_45%/0.55)]"
            >
              {retornoFinalizando ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Vamos lá"
              )}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground mt-2">
              Leia com calma. Ao tocar em Vamos lá sua nova jornada de redução começa.
            </p>
          </div>
        </div>
      )}

      <Dialog
        open={!!pendingMissionEnd}
        onOpenChange={(open) => {
          if (!open) return; // prevent closing without a choice
        }}
      >
        <DialogContent
          className="max-w-md rounded-3xl"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Concluir missão</DialogTitle>
            <DialogDescription>
              Deseja compartilhar um resumo da sua experiência no mural, de forma anônima, para ajudar outras pessoas?
            </DialogDescription>
          </DialogHeader>
          {pendingMissionEnd?.parsed?.resumo_mural && (
            <div className="rounded-2xl bg-[hsl(258_70%_97%)] ring-1 ring-[hsl(258_70%_90%)] px-4 py-3 text-sm text-foreground/90 whitespace-pre-wrap">
              {pendingMissionEnd.parsed.resumo_mural}
            </div>
          )}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={() => {
                if (!pendingMissionEnd) return;
                const { parsed, transcript } = pendingMissionEnd;
                setPendingMissionEnd(null);
                void finalizeMission(
                  { ...parsed, consentiu_postar: true },
                  transcript,
                );
              }}
              className="w-full"
            >
              Sim, compartilhar no mural
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (!pendingMissionEnd) return;
                const { parsed, transcript } = pendingMissionEnd;
                setPendingMissionEnd(null);
                void finalizeMission(
                  { ...parsed, consentiu_postar: false },
                  transcript,
                );
              }}
              className="w-full"
            >
              Não, apenas concluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MessageBubble({
  role,
  content,
  showBrain,
  brainSrc,
  showSpeaker,
  voiceEnabled,
  onSpeakerClick,
}: Msg & {
  showBrain?: boolean;
  brainSrc?: string;
  showSpeaker?: boolean;
  voiceEnabled?: boolean;
  onSpeakerClick?: () => void;
}) {
  if (role === "user") {
    return (
      <div className="flex justify-end w-full">
        <div className="max-w-[82%] min-w-0 break-words rounded-2xl rounded-tr-sm bg-gradient-to-br from-[hsl(220_90%_55%)] to-[hsl(258_70%_55%)] text-white px-4 py-2.5 text-sm shadow-[0_8px_22px_-12px_hsl(258_70%_45%/0.45)]">
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start items-end gap-2 w-full min-w-0">
      {showBrain && brainSrc ? (
        <img
          src={brainSrc}
          alt="Neo"
          className="h-14 w-14 flex-shrink-0 object-contain drop-shadow-[0_6px_14px_hsl(258_70%_45%/0.35)] animate-pulse-glow"
        />
      ) : (
        brainSrc && (
          <div className="h-8 w-8 flex-shrink-0 rounded-full bg-white/90 ring-1 ring-[hsl(258_70%_90%)] shadow-[0_4px_12px_-6px_hsl(258_70%_45%/0.35)] flex items-center justify-center overflow-hidden">
            <img src={brainSrc} alt="Neo" className="h-7 w-7 object-contain" />
          </div>
        )
      )}
      <div className="max-w-[82%] min-w-0 break-words rounded-2xl rounded-tl-sm bg-white/90 backdrop-blur-sm text-foreground px-4 py-2.5 text-sm shadow-[0_8px_22px_-12px_hsl(258_70%_45%/0.25)] ring-1 ring-black/[0.03] whitespace-pre-wrap">
        <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-p:leading-relaxed prose-ul:my-1.5 prose-ol:my-1.5 prose-strong:text-foreground">
          <ReactMarkdown>{content || "..."}</ReactMarkdown>
        </div>
        {showSpeaker && (
          <div className="mt-1.5 flex justify-end">
            <button
              type="button"
              onClick={onSpeakerClick}
              aria-label={voiceEnabled ? "Desativar voz" : "Ouvir mensagem"}
              className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors active:scale-95 ${
                voiceEnabled
                  ? "bg-[hsl(258_70%_55%)] text-white"
                  : "bg-[hsl(258_70%_95%)] text-[hsl(258_60%_45%)] hover:bg-[hsl(258_70%_90%)]"
              }`}
            >
              {voiceEnabled ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}