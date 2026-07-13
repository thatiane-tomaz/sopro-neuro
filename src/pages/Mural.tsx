import { useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, MessageCircleHeart, Plus, Sparkles, Trash2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useMuralPosts, useCreateMuralPost, useDeleteMuralPost, type MuralPost } from "@/hooks/useMural";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import WaveBackground from "@/components/home/WaveBackground";
import BottomNav from "@/components/home/BottomNav";
import PageLoader from "@/components/home/PageLoader";

const MAX_LEN = 600;

function PostCard({
  post,
  onDelete,
  canDelete,
}: {
  post: MuralPost;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const hue = post.color_hue ?? 258;
  const initial = (post.author_name || "").trim().charAt(0).toUpperCase() || "•";
  return (
    <div
      className="break-inside-avoid mb-3 rounded-2xl p-4 ring-1 ring-black/[0.04] shadow-[0_10px_30px_-14px_hsl(258_60%_40%/0.28)] relative overflow-hidden"
      style={{
        background: `linear-gradient(160deg, hsl(${hue} 90% 97%) 0%, hsl(${(hue + 40) % 360} 90% 96%) 100%)`,
      }}
    >
      <div
        className="pointer-events-none absolute -top-6 -right-6 h-20 w-20 rounded-full opacity-60 blur-2xl"
        style={{ background: `hsl(${hue} 80% 78%)` }}
      />
      <div className="relative">
        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 shadow-sm"
            style={{
              background: `linear-gradient(135deg, hsl(${hue} 75% 55%), hsl(${(hue + 40) % 360} 75% 60%))`,
            }}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-foreground truncate">
              {post.author_name || "Anônimo"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
              {post.day_number ? ` · Dia ${post.day_number}` : ""}
            </p>
          </div>
          {canDelete && (
            <button
              onClick={onDelete}
              aria-label="Apagar post"
              className="h-7 w-7 rounded-full bg-white/80 flex items-center justify-center text-muted-foreground hover:text-destructive active:scale-95 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="mt-3 text-[13.5px] leading-relaxed text-foreground/85 whitespace-pre-wrap">
          {post.content}
        </p>
      </div>
    </div>
  );
}

export default function Mural() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tema = searchParams.get("tema");
  const { user, loading: authLoading } = useAuth();
  const { profile } = useUserProfile();
  const { data: posts, isLoading } = useMuralPosts(tema);
  const createPost = useCreateMuralPost();
  const deletePost = useDeleteMuralPost();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [name, setName] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  const displayName = useMemo(
    () => (profile?.display_name || "").split(" ")[0] || "",
    [profile]
  );

  if (authLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  const handleOpen = () => {
    setContent("");
    setName(displayName);
    setAnonymous(false);
    setOpen(true);
  };

  const handleSubmit = async () => {
    const text = content.trim();
    if (text.length < 3) {
      toast({ title: "Conte um pouco mais", description: "Escreva pelo menos 3 caracteres.", variant: "destructive" });
      return;
    }
    try {
      await createPost.mutateAsync({
        content: text,
        authorName: anonymous ? null : (name.trim() || displayName || null),
        habitoTitulo: tema,
      });
      toast({ title: "Publicado no mural ✨", description: "Obrigado por compartilhar sua experiência." });
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Erro ao publicar", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apagar este post?")) return;
    try {
      await deletePost.mutateAsync(id);
      toast({ title: "Post apagado." });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-32">
      <WaveBackground />

      <div className="mx-auto max-w-md animate-page-in px-5 pt-[env(safe-area-inset-top)]">
        {/* Header */}
        <header className="flex items-center justify-between pt-4">
          <button
            onClick={() => navigate("/")}
            aria-label="Voltar"
            className="h-10 w-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-sm ring-1 ring-black/[0.03] active:scale-95"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur px-3 py-1.5 ring-1 ring-[hsl(258_70%_88%)]">
            <MessageCircleHeart className="h-3.5 w-3.5 text-[hsl(258_65%_52%)]" />
            <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-[hsl(258_60%_45%)]">
              Mural
            </span>
          </div>
          <div className="h-10 w-10" />
        </header>

        <div className="text-center mt-5 px-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[hsl(220_90%_55%)] to-[hsl(258_70%_55%)] bg-clip-text text-transparent leading-tight">
            {tema ? tema : (<>Um espaço para<br />compartilhar a jornada</>)}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
            Você não está sozinho!
          </p>
        </div>

        <button
          onClick={handleOpen}
          className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold text-white shadow-[0_12px_28px_-12px_hsl(258_70%_40%/0.7)] active:scale-[0.98] transition-transform"
          style={{
            background: "linear-gradient(135deg, hsl(220 90% 55%), hsl(258 70% 55%))",
          }}
        >
          <Plus className="h-4 w-4" />
          Compartilhar minha experiência
        </button>

        <div className="mt-6">
          {isLoading ? (
            <div className="text-center py-12 text-sm text-muted-foreground">Carregando…</div>
          ) : posts && posts.length > 0 ? (
            <div className="columns-2 gap-3">
              {posts.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  canDelete={p.user_id === user.id}
                  onDelete={() => handleDelete(p.id)}
                />
              ))}
            </div>
          ) : (
            <div className="mt-8 text-center rounded-3xl bg-white/80 backdrop-blur p-6 ring-1 ring-[hsl(258_70%_92%)] shadow-[0_10px_28px_-14px_hsl(258_70%_45%/0.3)]">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-[hsl(258_80%_95%)] flex items-center justify-center text-[hsl(258_65%_52%)]">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="mt-3 font-bold text-foreground">O mural ainda está em branco</p>
              <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">
                Seja a primeira pessoa a compartilhar uma experiência que possa inspirar quem está começando.
              </p>
            </div>
          )}
        </div>
      </div>

      <BottomNav />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-0 overflow-hidden border-0 bg-white shadow-[0_24px_60px_-20px_hsl(258_60%_40%/0.4)]">
          <div className="bg-gradient-to-br from-[hsl(258_80%_97%)] to-[hsl(220_80%_97%)] px-5 pt-5 pb-4 relative">
            <button
              onClick={() => setOpen(false)}
              aria-label="Fechar"
              className="absolute right-3 top-3 h-8 w-8 rounded-full bg-white/90 flex items-center justify-center text-foreground/70 shadow-sm"
            >
              <X className="h-4 w-4" />
            </button>
            <DialogHeader className="text-left space-y-1">
              <div className="h-10 w-10 rounded-2xl bg-white text-[hsl(258_60%_50%)] flex items-center justify-center shadow-sm mb-2">
                <MessageCircleHeart className="h-5 w-5" />
              </div>
              <DialogTitle className="text-base font-bold text-foreground">
                Compartilhe no mural
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Uma frase, um insight, uma virada pode inspirar outra pessoa hoje.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-5 py-4 space-y-3">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_LEN))}
              placeholder="Conte como está sendo sua experiência…"
              rows={5}
              className="resize-none rounded-xl border-[hsl(258_70%_92%)] focus-visible:ring-[hsl(258_70%_70%)]"
            />
            <div className="flex justify-end text-[11px] text-muted-foreground">
              {content.length}/{MAX_LEN}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[12px] font-medium text-foreground/80">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="h-4 w-4 rounded border-[hsl(258_70%_80%)] text-[hsl(258_65%_52%)]"
                />
                Publicar como anônimo
              </label>
              {!anonymous && (
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 40))}
                  placeholder="Como você quer aparecer"
                  className="rounded-xl border-[hsl(258_70%_92%)] focus-visible:ring-[hsl(258_70%_70%)]"
                />
              )}
            </div>
          </div>

          <DialogFooter className="px-5 pb-5 pt-1 flex-row gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setOpen(false)}
              disabled={createPost.isPending}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 rounded-xl bg-gradient-to-br from-[hsl(220_90%_55%)] to-[hsl(258_70%_55%)] text-white shadow-md"
              disabled={createPost.isPending || content.trim().length < 3}
              onClick={handleSubmit}
            >
              {createPost.isPending ? "Publicando…" : "Publicar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}