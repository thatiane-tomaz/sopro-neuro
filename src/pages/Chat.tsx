import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import WaveBackground from "@/components/home/WaveBackground";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
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
  const { toast } = useToast();

  const firstName = (profile?.display_name || "").split(" ")[0] || "";
  const greeting = firstName
    ? `Oi ${firstName}! 💙 Sou o seu cérebro aprendendo uma nova forma de viver. Me conta — como você tá se sentindo agora?`
    : "Oi! 💙 Sou o seu cérebro aprendendo uma nova forma de viver. Me conta — como você tá se sentindo agora?";

  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: greeting },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  useEffect(() => () => abortRef.current?.abort(), []);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

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

      {/* Header */}
      <header className="relative z-10 px-5 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto max-w-md flex items-center gap-3 pt-4 pb-3">
          <button
            onClick={() => navigate("/dashboard")}
            aria-label="Voltar"
            className="h-10 w-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-[0_4px_14px_-4px_hsl(220_40%_40%/0.18)] ring-1 ring-black/[0.03]"
          >
            <ArrowLeft className="h-5 w-5 text-primary" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="h-10 w-10 rounded-full overflow-hidden bg-white/80 flex items-center justify-center shadow-[0_4px_14px_-4px_hsl(258_70%_45%/0.35)] ring-1 ring-black/[0.03]">
              <img src={brainImg} alt="Cérebro" className="w-full h-full object-contain" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-foreground">Seu Cérebro</p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sempre por perto 💙
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="relative z-10 flex-1 overflow-y-auto px-5 pb-2"
      >
        <div className="mx-auto max-w-md space-y-3 py-2">
          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} />
          ))}
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
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Fala comigo..."
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none max-h-32 rounded-2xl bg-white px-4 py-3 text-sm shadow-[0_8px_22px_-12px_hsl(258_70%_45%/0.25)] ring-1 ring-[hsl(258_70%_92%)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_70%_70%)] placeholder:text-muted-foreground/70"
          />
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

function MessageBubble({ role, content }: Msg) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[82%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-[hsl(220_90%_55%)] to-[hsl(258_70%_55%)] text-white px-4 py-2.5 text-sm shadow-[0_8px_22px_-12px_hsl(258_70%_45%/0.45)]">
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white/90 backdrop-blur-sm text-foreground px-4 py-2.5 text-sm shadow-[0_8px_22px_-12px_hsl(258_70%_45%/0.25)] ring-1 ring-black/[0.03]">
        <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-p:leading-relaxed prose-ul:my-1.5 prose-ol:my-1.5 prose-strong:text-foreground">
          <ReactMarkdown>{content || "..."}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}