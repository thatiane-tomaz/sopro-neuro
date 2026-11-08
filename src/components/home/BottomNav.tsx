import { useNavigate, useLocation } from "react-router-dom";
import { Compass, LineChart, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const Item = ({
    label,
    icon: Icon,
    to,
    active,
  }: {
    label: string;
    icon: any;
    to: string;
    active: boolean;
  }) => (
    <Button
      variant="ghost"
      onClick={() => navigate(to)}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`h-14 flex-1 flex flex-col items-center gap-1 rounded-2xl px-1 py-2 hover:bg-muted/50 hover:text-foreground active:scale-95 ${
        active
          ? "text-electric-blue"
          : "text-muted-foreground hover:text-foreground/70"
      }`}
    >
      <Icon className={`h-5 w-5 transition-transform ${active ? "scale-110" : ""}`} strokeWidth={active ? 2.4 : 2} />
      <span className={`text-sm ${active ? "font-semibold" : "font-medium"}`}>{label}</span>
    </Button>
  );

  return (
    <nav aria-label="Navegação principal" className="fixed bottom-0 inset-x-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-md px-4 pb-3">
        <div className="relative bg-surface-raised/90 backdrop-blur-xl rounded-[26px] shadow-navigation ring-1 ring-border/60 flex items-center px-3 h-16">
          <Item label="Jornada" icon={Compass} to="/jornada" active={pathname === "/jornada"} />
          <div className="w-20 shrink-0 self-stretch">
          <Button
            variant="ghost"
            aria-label="Início"
            aria-current={pathname === "/dashboard" ? "page" : undefined}
            onClick={() => navigate("/dashboard")}
            className={`absolute left-1/2 -translate-x-1/2 -top-5 h-14 w-14 rounded-full bg-gradient-method flex items-center justify-center ring-4 ring-surface-raised shadow-wellness hover:bg-lilac hover:text-primary-foreground active:scale-95 ${
              pathname === "/dashboard"
                ? "opacity-100"
                : "opacity-85"
            }`}
          >
            <Brain className="!h-7 !w-7 text-primary-foreground" strokeWidth={2.4} />
          </Button>
          <span aria-hidden className={`absolute left-1/2 bottom-2 -translate-x-1/2 text-sm ${pathname === "/dashboard" ? "font-semibold text-electric-blue" : "font-medium text-muted-foreground"}`}>Início</span>
          </div>
          <Item label="Progresso" icon={LineChart} to="/progresso" active={pathname === "/progresso"} />
        </div>
      </div>
    </nav>
  );
}