import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircleHeart, Sparkles, ArrowRight } from "lucide-react";
import { useMuralPosts } from "@/hooks/useMural";

const FALLBACK = [
  {
    id: "f1",
    author_name: "Alguém como você",
    content:
      "Compartilhe o primeiro post do mural. Um pequeno relato pode inspirar quem está começando agora.",
    color_hue: 258,
  },
];

export default function MuralPreview() {
  const navigate = useNavigate();
  const { data } = useMuralPosts();
  const posts = (data && data.length > 0 ? data.slice(0, 6) : FALLBACK) as any[];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (posts.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % posts.length), 5000);
    return () => clearInterval(t);
  }, [posts.length]);

  const current = posts[idx % posts.length];
  const excerpt =
    current.content.length > 140
      ? current.content.slice(0, 140).trimEnd() + "…"
      : current.content;
  const initial =
    (current.author_name || "").trim().charAt(0).toUpperCase() || "•";
  const hue = current.color_hue ?? 258;

  return (
    <button
      onClick={() => navigate("/mural")}
      className="group mt-6 w-full text-left rounded-3xl p-5 relative overflow-hidden ring-1 ring-black/[0.04] shadow-[0_18px_50px_-20px_hsl(258_70%_45%/0.35)] active:scale-[0.995] transition-transform"
      style={{
        background:
          "linear-gradient(135deg, hsl(258 90% 96%) 0%, hsl(220 90% 96%) 55%, hsl(180 70% 94%) 100%)",
      }}
      aria-label="Abrir o mural de experiências"
    >
      {/* decorative blobs */}
      <div
        className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full opacity-60 blur-2xl"
        style={{ background: `hsl(${hue} 80% 78%)` }}
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full opacity-50 blur-2xl"
        style={{ background: `hsl(${(hue + 60) % 360} 85% 82%)` }}
      />

      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur px-2.5 py-1 ring-1 ring-[hsl(258_70%_88%)]">
            <MessageCircleHeart className="h-3 w-3 text-[hsl(258_65%_52%)]" />
            <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[hsl(258_60%_45%)]">
              Mural
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[hsl(258_60%_45%)]">
            Ver tudo <ArrowRight className="h-3 w-3" />
          </span>
        </div>

        <h3 className="mt-3 text-[15px] font-bold text-foreground leading-snug">
          Você não está sozinho nessa
        </h3>
        <p className="mt-1 text-[12px] text-foreground/70 leading-snug whitespace-nowrap">
          Veja quem já passou por isso
        </p>

        <div className="mt-4 rounded-2xl bg-white/85 backdrop-blur-sm p-3.5 ring-1 ring-white/70 shadow-[0_6px_18px_-10px_hsl(258_70%_45%/0.35)]">
          <div className="flex items-start gap-2.5">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
              style={{
                background: `linear-gradient(135deg, hsl(${hue} 75% 55%), hsl(${(hue + 40) % 360} 75% 60%))`,
              }}
            >
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] leading-relaxed text-foreground/85 italic">
                “{excerpt}”
              </p>
              {current.author_name && (
                <p className="mt-1.5 text-[11px] font-semibold text-[hsl(258_60%_45%)]">
                  {current.author_name}
                </p>
              )}
            </div>
          </div>
        </div>

        {posts.length > 1 && (
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {posts.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === idx % posts.length
                    ? "w-5 bg-[hsl(258_65%_52%)]"
                    : "w-1.5 bg-[hsl(258_40%_80%)]"
                }`}
              />
            ))}
          </div>
        )}

        <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-foreground/70">
          <Sparkles className="h-3 w-3 text-[hsl(258_65%_52%)]" />
          Sua vitória pode ajudar alguém
        </div>
      </div>
    </button>
  );
}