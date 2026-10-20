import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import WaveBackground from "@/components/home/WaveBackground";
import soproLogo from "@/assets/sopro-logo.webp";

/**
 * Moldura das telas de conta (Conta, Cancelar assinatura, Excluir conta):
 * mesmo fundo de ondas, largura, topo e título das telas principais.
 */
export function AccountShell({
  title,
  subtitle,
  closeTo = "/dashboard",
  children,
}: {
  title: string;
  subtitle?: string;
  closeTo?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-x-hidden pb-12">
      <WaveBackground />

      <div className="mx-auto max-w-md animate-page-in px-3 pt-[env(safe-area-inset-top)]">
        <header className="flex items-center justify-between px-2 pt-4">
          <img src={soproLogo} alt="Sopro Neuro" className="h-10 w-auto" />
          <Link
            to={closeTo}
            aria-label="Fechar"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-card/80 text-primary shadow-primary ring-1 ring-border/40 backdrop-blur transition-transform active:scale-95"
          >
            <X className="h-5 w-5" />
          </Link>
        </header>

        <div className="mt-6 px-2">
          <h1 className="text-balance text-xl font-bold bg-gradient-to-r from-[hsl(220_90%_55%)] to-[hsl(230_90%_45%)] bg-clip-text text-transparent">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-balance text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        <div className="mt-4 space-y-3">{children}</div>
      </div>
    </div>
  );
}

/** Card branco translúcido usado nas telas principais. */
export function AccountCard({
  icon,
  title,
  description,
  tone = "default",
  children,
}: {
  icon?: ReactNode;
  title?: string;
  description?: string;
  tone?: "default" | "danger";
  children?: ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-card/80 p-4 shadow-primary ring-1 ring-border/40 backdrop-blur-md">
      {(icon || title) && (
        <div className="flex items-center gap-3">
          {icon && (
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                tone === "danger"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-[hsl(var(--lilac-soft))] text-[hsl(var(--lilac))]"
              }`}
            >
              {icon}
            </div>
          )}
          <div className="min-w-0">
            {title && (
              <h2
                className={`text-balance text-base font-bold leading-tight ${
                  tone === "danger" ? "text-destructive" : "text-[hsl(var(--electric-blue))]"
                }`}
              >
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-0.5 text-balance text-[13px] leading-snug text-muted-foreground font-medium">
                {description}
              </p>
            )}
          </div>
        </div>
      )}
      {children && <div className={icon || title ? "mt-4" : ""}>{children}</div>}
    </section>
  );
}

export const accountInputClass =
  "h-12 rounded-2xl border-0 bg-muted/60 pl-11 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--lilac)/0.5)] focus-visible:ring-offset-0";

export const accountPrimaryButtonClass =
  "h-12 w-full rounded-full bg-gradient-to-r from-[hsl(var(--electric-blue))] to-[hsl(var(--lilac))] text-sm font-bold text-primary-foreground shadow-wellness transition-transform active:scale-[0.98] disabled:opacity-50";
