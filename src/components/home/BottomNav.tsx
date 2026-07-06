import { useNavigate, useLocation } from "react-router-dom";
import { Compass, LineChart, Waves } from "lucide-react";

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
    <button
      onClick={() => navigate(to)}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`flex-1 flex flex-col items-center gap-1 py-2 transition-all duration-200 active:scale-95 ${
        active
          ? "text-[hsl(230_85%_55%)]"
          : "text-muted-foreground hover:text-foreground/70"
      }`}
    >
      <Icon className={`h-5 w-5 transition-transform ${active ? "scale-110" : ""}`} strokeWidth={active ? 2.4 : 2} />
      <span className={`text-[11px] tracking-tight ${active ? "font-semibold" : "font-medium"}`}>{label}</span>
    </button>
  );

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-md px-4 pb-3">
        <div className="relative bg-white/85 backdrop-blur-xl rounded-[26px] shadow-[0_16px_40px_-14px_hsl(258_70%_45%/0.28)] ring-1 ring-black/[0.04] flex items-center px-3 h-16">
          <Item label="Jornada" icon={Compass} to="/jornada" active={pathname === "/jornada"} />
          <div className="w-20" />
          <Item label="Progresso" icon={LineChart} to="/progresso" active={pathname === "/progresso"} />

          <button
            aria-label="Início"
            aria-current={pathname === "/dashboard" ? "page" : undefined}
            onClick={() => navigate("/dashboard")}
            className={`absolute left-1/2 -translate-x-1/2 -top-6 h-16 w-16 rounded-full flex items-center justify-center ring-4 ring-white/90 shadow-[0_12px_28px_-8px_hsl(258_80%_55%/0.55)] transition-transform duration-200 active:scale-95 ${
              pathname === "/dashboard"
                ? "bg-gradient-to-br from-[hsl(230_85%_60%)] to-[hsl(258_80%_60%)]"
                : "bg-gradient-to-br from-[hsl(230_85%_70%)] to-[hsl(258_80%_70%)]"
            }`}
          >
            <Waves className="h-7 w-7 text-white" strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
}