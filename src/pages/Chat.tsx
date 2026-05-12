import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Loader2, Mic, Square, Volume2, VolumeX } from "lucide-react";
import ReactMarkdown from "react-markdown";
import WaveBackground from "@/components/home/WaveBackground";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsFreelist } from "@/hooks/useIsFreelist";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useToast } from "@/hooks/use-toast";
import brainImg from "@/assets/brain-user.png";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Tô com vontade de fumar agora 😩",
  "Por que sinto tanta ansiedade?",
  "Me dá uma força",
  "O que tá acontecendo no meu cérebro?",
];

export default function Chat() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile } = useUserProfile();
  const { isPremium, loading: subLoading } = useSubscription();
  const { isFreelist, loading: freelistLoading } = useIsFreelist();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { toast } = useToast();

  const firstName = (profile?.display_name || "").split(" ")[0] || "";
  const greeting = `Olá${firstName ? ` ${firstName}` : ""}! Estou aqui para te ajudar a entender seu cérebro e te guiar na jornada para parar de fumar.\n\nMe conte suas dúvidas e o que está sentindo agora.`;

  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: greeting },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const spokenRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

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
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) {
          toast({ title: "Espera um instante", description: "Muitas mensagens em pouco tempo.", variant: "destructive" });
        } else if (resp.status === 402) {
          toast({ title: "Indisponível agora", description: "Tente novamente em alguns instantes.", variant: "destructive" });
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
          copy[copy.length - 1] = { role: "assistant", content: assistantSoFar };
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

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      <WaveBackground />

      {/* Floating back button (no full header) */}
      <div className="absolute top-[env(safe-area-inset-top)] left-4 z-20 pt-3">
        <button
          onClick={() => navigate("/dashboard")}
          aria-label="Voltar"
          className="h-10 w-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-[0_4px_14px_-4px_hsl(220_40%_40%/0.18)] ring-1 ring-black/[0.03]"
        >
          <ArrowLeft className="h-5 w-5 text-primary" />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="relative z-10 flex-1 overflow-y-auto px-5 pb-2 pt-[calc(env(safe-area-inset-top)+64px)]"
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
                showSpeaker={isLastAssistant}
                voiceEnabled={voiceEnabled}
                onSpeakerClick={() => handleSpeakerClick(m.content)}
              />
            );
          })}
          {isStreaming && messages[messages.length - 1]?.content === "" && (
            <div className="flex justify-start">
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
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-3 py-2 rounded-full bg-white/80 backdrop-blur-sm ring-1 ring-[hsl(258_70%_92%)] text-[hsl(258_60%_45%)] font-medium shadow-sm active:scale-95 transition-transform"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="relative z-10 px-5 pb-[max(env(safe-area-inset-bottom),12px)] pt-2 bg-gradient-to-t from-white/80 via-white/40 to-transparent">
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
            className="w-full resize-none max-h-32 rounded-2xl bg-white pl-4 pr-12 py-3 text-sm shadow-[0_8px_22px_-12px_hsl(258_70%_45%/0.25)] ring-1 ring-[hsl(258_70%_92%)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_70%_70%)] placeholder:text-muted-foreground/70"
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
    </div>
  );
}

function MessageBubble({
  role,
  content,
  showBrain,
  showSpeaker,
  voiceEnabled,
  onSpeakerClick,
}: Msg & {
  showBrain?: boolean;
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
      {showBrain && (
        <img
          src={brainImg}
          alt="Cérebro"
          className="h-14 w-14 flex-shrink-0 object-contain drop-shadow-[0_6px_14px_hsl(258_70%_45%/0.35)] animate-pulse-glow"
        />
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