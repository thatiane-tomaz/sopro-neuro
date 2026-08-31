import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Send } from "lucide-react";
import brainAvatar from "@/assets/brain/neo.webp";
import type { OnboardingData } from "@/pages/Onboarding";
import {
  EMOTION_OPTIONS,
  MOMENT_OPTIONS,
  SUBSTANCE_OPTIONS,
} from "./habitOptions";

type Journey = "reducao" | "abstinencia";

type BotStep =
  | { key: "intro"; kind: "info"; text: (d: OnboardingData) => string }
  | {
      key: keyof OnboardingData | "intro2" | "insight" | "done";
      kind: "info";
      text: (d: OnboardingData) => string;
    }
  | {
      key: keyof OnboardingData;
      kind: "text" | "number" | "money" | "longtext";
      text: (d: OnboardingData) => string;
      placeholder?: string;
      optional?: boolean;
      suffix?: string;
      prefix?: string;
    }
  | {
      key: keyof OnboardingData;
      kind: "single";
      text: (d: OnboardingData) => string;
      options: { value: string; label: string }[];
    }
  | {
      key: keyof OnboardingData;
      kind: "multi";
      text: (d: OnboardingData) => string;
      options: { label: string }[];
      minOne?: boolean;
    };

interface Msg {
  from: "bot" | "user";
  text: string;
}

const past = (d: OnboardingData) => d.journeyType === "abstinencia";

const buildSteps = (): BotStep[] => [
  {
    key: "intro",
    kind: "info",
    text: () =>
      "Oi! Eu sou o Neo, o cérebro do Sopro 🧠✨ Vou te fazer algumas perguntinhas para entender sua história com o cigarro. Nada de julgamento, quanto mais real, melhor a jornada que monto pra você.",
  },
  {
    key: "age",
    kind: "number",
    text: () => "Pra começar, quantos anos você tem?",
    placeholder: "Ex: 32",
    suffix: "anos",
  },
  {
    key: "gender",
    kind: "single",
    text: () => "Como você se identifica?",
    options: [
      { value: "Feminino", label: "Feminino" },
      { value: "Masculino", label: "Masculino" },
      { value: "Não-binárie", label: "Não-binárie" },
      { value: "Prefiro não responder", label: "Prefiro não responder" },
    ],
  },
  {
    key: "journeyType",
    kind: "single",
    text: () =>
      "Antes de tudo, me conta: qual momento descreve você hoje?",
    options: [
      { value: "reducao", label: "Ainda fumo e quero reduzir" },
      { value: "abstinencia", label: "Já parei de fumar" },
    ],
  },
  {
    key: "cigarettesPerDay",
    kind: "number",
    text: (d) =>
      past(d)
        ? "Que conquista! 👏 Pra eu entender de onde você veio: quantos cigarros costumava fumar por dia?"
        : "Beleza. Em média, quantos cigarros você fuma por dia hoje?",
    placeholder: "Ex: 10",
    suffix: "cigarros/dia",
  },
  {
    key: "vapesPerMonth",
    kind: "number",
    text: (d) =>
      past(d)
        ? "E quantos vapes você usava por mês? (coloque 0 se não usava)"
        : "E quantos vapes você usa por mês? (coloque 0 se não usa)",
    placeholder: "Ex: 2",
    suffix: "vapes/mês",
  },
  {
    key: "weeklyCost",
    kind: "money",
    text: (d) =>
      past(d)
        ? "Quanto você gastava por semana com cigarro/vape?"
        : "Quanto você gasta por semana com cigarro/vape?",
    placeholder: "0",
    prefix: "R$",
  },
  {
    key: "smokingTypes",
    kind: "multi",
    text: (d) =>
      past(d)
        ? "O que você costumava fumar? (pode marcar mais de um)"
        : "O que você costuma fumar? (pode marcar mais de um)",
    options: [
      { label: "Cigarro industrializado" },
      { label: "Tabaco enrolado" },
      { label: "Cigarro de palha" },
      { label: "Vape / Pod eletrônico" },
      { label: "Charuto / narguilé" },
      { label: "Outro" },
    ],
  },
  {
    key: "habitEmotions",
    kind: "multi",
    text: (d) =>
      past(d)
        ? "Em quais dessas situações você costumava fumar?"
        : "Em quais dessas situações você costuma fumar?",
    options: EMOTION_OPTIONS.map((o) => ({ label: o.label })),
  },
  {
    key: "habitMoments",
    kind: "multi",
    text: (d) =>
      past(d)
        ? "E em quais momentos do dia isso acontecia?"
        : "E em quais momentos do dia isso acontece?",
    options: MOMENT_OPTIONS.map((o) => ({ label: o.label })),
  },
  {
    key: "habitSubstances",
    kind: "multi",
    text: (d) =>
      past(d)
        ? "Costumava fumar junto com alguma dessas coisas?"
        : "Costuma fumar junto com alguma dessas coisas?",
    options: SUBSTANCE_OPTIONS.map((o) => ({ label: o.label })),
  },
  {
    key: "cigaretteStory",
    kind: "longtext",
    optional: true,
    text: (d) =>
      past(d)
        ? "Pra fechar, quer me contar com suas palavras como era a sua relação com o cigarro? Escreva o quanto quiser (ou toque em pular)."
        : "Pra fechar, quer me contar com suas palavras como é a sua relação com o cigarro? Escreva o quanto quiser (ou toque em pular).",
    placeholder: "Escreva aqui como você se sente...",
  },
  {
    key: "insight",
    kind: "info",
    text: (d) => {
      const gatilhos =
        (d.habitEmotions?.length || 0) +
        (d.habitMoments?.length || 0) +
        (d.habitSubstances?.length || 0);
      if (past(d)) {
        return `Entendi tudo. 🧠 Você mapeou ${gatilhos} gatilhos que faziam parte da sua rotina. Vou usar isso pra fortalecer sua liberdade e proteger você quando eles aparecerem.`;
      }
      return `Ótimo. 🧠 Você me mostrou ${gatilhos} gatilhos importantes. Cada um deles é uma oportunidade de reprogramar o hábito — e é exatamente isso que vamos fazer juntos.`;
    },
  },
  {
    key: "done",
    kind: "info",
    text: () =>
      "Pronto! Vou montar sua jornada personalizada agora. Toca em Começar quando quiser. 💙",
  },
];

interface Props {
  data: OnboardingData;
  updateData: (d: Partial<OnboardingData>) => void;
  onFinish: () => void;
  isSubmitting: boolean;
}

const ChatOnboarding = ({ data, updateData, onFinish, isSubmitting }: Props) => {
  const steps = useMemo(() => buildSteps(), []);
  const [stepIndex, setStepIndex] = useState(0);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(true);
  const [inputText, setInputText] = useState("");
  const [multiSel, setMultiSel] = useState<string[]>([]);
  const [visualViewport, setVisualViewport] = useState({ height: 0, offsetTop: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputScrollRef = useRef<HTMLDivElement>(null);

  const current = steps[stepIndex];

  // iOS browsers may calculate 100dvh behind the address and bottom bars.
  // Track the actually visible viewport so the answer area remains on screen.
  useEffect(() => {
    const viewport = window.visualViewport;
    const updateViewport = () => {
      setVisualViewport({
        height: Math.round(viewport?.height ?? window.innerHeight),
        offsetTop: Math.round(viewport?.offsetTop ?? 0),
      });
    };

    updateViewport();
    viewport?.addEventListener("resize", updateViewport);
    viewport?.addEventListener("scroll", updateViewport);
    window.addEventListener("resize", updateViewport);

    return () => {
      viewport?.removeEventListener("resize", updateViewport);
      viewport?.removeEventListener("scroll", updateViewport);
      window.removeEventListener("resize", updateViewport);
    };
  }, []);

  // Show current bot message with typing delay
  useEffect(() => {
    if (!current) return;
    setTyping(true);
    setInputText("");
    setMultiSel([]);
    const t = setTimeout(() => {
      setMessages((m) => [...m, { from: "bot", text: current.text(data) }]);
      setTyping(false);
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  // Auto-scroll: pin chat to the bottom, and show the options from their start
  useEffect(() => {
    const pin = () => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      inputScrollRef.current?.scrollTo({ top: 0 });
    };
    pin();
    const t1 = setTimeout(pin, 60);
    const t2 = setTimeout(pin, 250);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [messages, typing, stepIndex]);


  const advance = (userLabel?: string) => {
    if (userLabel) {
      setMessages((m) => [...m, { from: "user", text: userLabel }]);
    }
    setTimeout(() => setStepIndex((i) => Math.min(i + 1, steps.length - 1)), 250);
  };

  const handleSingle = (key: keyof OnboardingData, value: string, label: string) => {
    updateData({ [key]: value } as Partial<OnboardingData>);
    advance(label);
  };

  const handleTextSubmit = () => {
    const v = inputText.trim();
    if (!v) return;
    const key = current.key as keyof OnboardingData;
    if (current.kind === "number") {
      const n = v.replace(/\D/g, "");
      if (!n) return;
      updateData({ [key]: n } as Partial<OnboardingData>);
      advance(n);
    } else if (current.kind === "money") {
      const n = v.replace(/[^\d,]/g, "");
      if (!n) return;
      updateData({ [key]: n } as Partial<OnboardingData>);
      advance(`R$ ${n}`);
    } else {
      updateData({ [key]: v } as Partial<OnboardingData>);
      advance(v);
    }
  };

  const handleSkip = () => {
    advance("Prefiro pular");
  };

  const toggleMulti = (label: string) => {
    setMultiSel((s) => {
      if (label === "Nenhuma") return s.includes(label) ? [] : ["Nenhuma"];
      const base = s.filter((x) => x !== "Nenhuma");
      return base.includes(label) ? base.filter((x) => x !== label) : [...base, label];
    });
  };

  const handleMultiSubmit = () => {
    if (multiSel.length === 0) return;
    const key = current.key as keyof OnboardingData;
    updateData({ [key]: multiSel } as Partial<OnboardingData>);
    advance(multiSel.join(", "));
  };

  const isLast = stepIndex === steps.length - 1;
  const isInfo = current?.kind === "info";

  return (
    <div
      className="fixed inset-x-0 overflow-hidden grid grid-rows-[auto_minmax(0,1fr)_auto]"
      style={{
        top: visualViewport.offsetTop,
        height: visualViewport.height || "100dvh",
      }}
    >
      {/* Background */}
      <div
        className="absolute inset-0 -z-20"
        style={{
          background:
            "linear-gradient(180deg, hsl(210 60% 98%) 0%, hsl(220 70% 96%) 45%, hsl(258 70% 95%) 100%)",
        }}
        aria-hidden
      />
      <div className="absolute inset-0 -z-10 pointer-events-none" aria-hidden>
        <div className="absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full bg-[hsl(258_80%_72%/0.22)] blur-[90px]" />
        <div className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full bg-primary/15 blur-[80px]" />
      </div>

      {/* Header */}
      <div className="pt-[calc(env(safe-area-inset-top)+12px)] pb-3 px-5 flex items-center gap-3 border-b border-white/50 backdrop-blur-md bg-white/40">
        <div className="relative">
          <img
            src={brainAvatar}
            alt="Neo"
            className="w-11 h-11 rounded-full object-contain bg-white/70 p-0.5 shadow-md"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-foreground">Neo</div>
          <div className="text-xs text-emerald-600 font-medium">online agora</div>
        </div>
      </div>

      {/* Messages (fills remaining space above input) */}
      <div ref={scrollRef} className="min-h-0 overflow-y-auto overscroll-contain px-4 py-5 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.from === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
          >
            {m.from === "bot" && (
              <img
                src={brainAvatar}
                alt=""
                className="w-8 h-8 rounded-full object-contain bg-white/70 p-0.5 mr-2 mt-auto shadow-sm"
              />
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-[16px] leading-[1.55] text-pretty shadow-sm ${
                m.from === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-white/90 text-foreground rounded-bl-sm border border-white"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start animate-fade-in">
            <img src={brainAvatar} alt="" className="w-8 h-8 rounded-full object-contain bg-white/70 p-0.5 mr-2 mt-auto shadow-sm" />
            <div className="bg-white/90 border border-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Answer area stays visible; only its own long option lists can scroll. */}
      <div ref={inputScrollRef} className="min-h-[80px] max-h-[62vh] overflow-y-auto overscroll-contain border-t border-white/60 backdrop-blur-md bg-white/60 px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        {!typing && current && (
          <>
            {isInfo && !isLast && current.key === "intro" && (
              <Button
                onClick={() => advance("Bora!")}
                className="w-full h-12 rounded-full text-white"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(230 75% 55%) 45%, hsl(var(--lilac)) 100%)",
                }}
              >
                Bora! <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}

            {isInfo && current.key === "insight" && (
              <Button
                onClick={() => advance()}
                className="w-full h-12 rounded-full text-white"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(230 75% 55%) 45%, hsl(var(--lilac)) 100%)",
                }}
              >
                Continuar <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}

            {isInfo && isLast && (
              <Button
                onClick={onFinish}
                disabled={isSubmitting}
                className="w-full h-12 rounded-full text-white"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(230 75% 55%) 45%, hsl(var(--lilac)) 100%)",
                }}
              >
                {isSubmitting ? "Preparando..." : "Começar minha jornada"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}

            {current.kind === "single" && (
              <div className="grid gap-2">
                {current.options.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => handleSingle(current.key as keyof OnboardingData, o.value, o.label)}
                    className="w-full text-left px-4 py-3 rounded-2xl bg-white border border-white hover:border-primary/40 hover:bg-primary/5 transition-all text-[15px] font-medium shadow-sm"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}

            {current.kind === "multi" && (
              <div className="space-y-3">
                <div className="space-y-2 pr-1 max-h-[38vh] overflow-y-auto overscroll-contain">
                  {current.options.map((o) => {
                    const sel = multiSel.includes(o.label);
                    return (
                      <button
                        key={o.label}
                        onClick={() => toggleMulti(o.label)}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-[15px] transition-all ${
                          sel
                            ? "bg-primary/10 border-primary/40 text-foreground font-medium"
                            : "bg-white border-white text-foreground/80 hover:bg-primary/5"
                        }`}
                      >
                        {sel ? "✓ " : ""}{o.label}
                      </button>
                    );
                  })}
                </div>
                <Button
                  onClick={handleMultiSubmit}
                  disabled={multiSel.length === 0}
                  className="sticky bottom-0 w-full h-11 rounded-full text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(230 75% 55%) 45%, hsl(var(--lilac)) 100%)",
                  }}
                >
                  Enviar {multiSel.length > 0 && `(${multiSel.length})`}
                </Button>
              </div>
            )}


            {current.kind === "longtext" && (
              <div className="space-y-3">
                <Textarea
                  autoFocus
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={current.placeholder}
                  rows={4}
                  className="rounded-2xl bg-white border-white resize-none"
                />
                <div className="flex items-center gap-2">
                  {current.optional && (
                    <Button
                      variant="ghost"
                      onClick={handleSkip}
                      className="h-12 rounded-full flex-1 text-muted-foreground"
                    >
                      Pular
                    </Button>
                  )}
                  <Button
                    onClick={handleTextSubmit}
                    disabled={!inputText.trim()}
                    className="h-12 rounded-full flex-1 text-white"
                    style={{
                      background:
                        "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(230 75% 55%) 45%, hsl(var(--lilac)) 100%)",
                    }}
                  >
                    Enviar
                  </Button>
                </div>
              </div>
            )}

            {(current.kind === "text" || current.kind === "number" || current.kind === "money") && (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  {current.prefix && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                      {current.prefix}
                    </span>
                  )}
                  <Input
                    autoFocus
                    inputMode={current.kind === "text" ? "text" : "numeric"}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleTextSubmit();
                    }}
                    placeholder={current.placeholder}
                    className={`h-12 rounded-full bg-white border-white ${
                      current.prefix ? "pl-10" : "pl-4"
                    } ${current.suffix ? "pr-24" : "pr-4"}`}
                  />
                  {current.suffix && (
                    <span className="absolute right-14 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {current.suffix}
                    </span>
                  )}
                </div>
                <Button
                  onClick={handleTextSubmit}
                  disabled={!inputText.trim()}
                  size="icon"
                  className="h-12 w-12 rounded-full text-white shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(230 75% 55%) 45%, hsl(var(--lilac)) 100%)",
                  }}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatOnboarding;