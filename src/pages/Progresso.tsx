import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  Calendar as CalendarIcon,
  Cigarette,
  DollarSign,
  HelpCircle,
  LogOut,
  Pencil,
  Plus,
  TrendingDown,
  User,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useOnboardingData } from "@/hooks/useOnboardingData";
import {
  useSmokingLogs,
  toLocalDateStr,
  yesterdayStr,
} from "@/hooks/useSmokingLogs";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/home/BottomNav";
import PageLoader from "@/components/home/PageLoader";
import WaveBackground from "@/components/home/WaveBackground";
import SmokingLogDialog from "@/components/SmokingLogDialog";
import ConsumptionEditDialog from "@/components/ConsumptionEditDialog";

import soproLogo from "@/assets/sopro-logo.webp";
import { performLogout } from "@/lib/logout";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
};

const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatBRLCompact = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export default function Progresso() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { data: onboarding, isLoading: onbLoading, refetch: refetchOnboarding } =
    useOnboardingData() as any;
  const { logs, isLoading: logsLoading } = useSmokingLogs();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState<string | undefined>();
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [pendingDate, setPendingDate] = useState<Date | undefined>();
  const [savingDate, setSavingDate] = useState(false);
  const [consumoDialogOpen, setConsumoDialogOpen] = useState(false);


  // Journey history: define a jornada atual e os períodos em que o usuário
  // esteve na jornada de liberdade (abstinência). Esses dias contam como 0.
  const { data: journey } = useQuery({
    queryKey: ["progresso-jornada", user?.id],
    enabled: !!user?.id,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const [hist, onb] = await Promise.all([
        (supabase as any)
          .from("historico_jornada_usuario")
          .select("jornada, created_at")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: true }),
        (supabase as any)
          .from("onboarding_responses_v2")
          .select("jornada_inicial")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      const rows: { jornada: string; created_at: string }[] = hist?.data ?? [];
      const inicial: string = onb?.data?.jornada_inicial ?? rows[0]?.jornada ?? "reducao";
      const atual = rows.length ? rows[rows.length - 1].jornada : inicial;

      // Intervalos [start, end) em que a jornada era de abstinência.
      const intervals: { start: string; end: string | null }[] = [];
      rows.forEach((r, idx) => {
        if (r.jornada !== "abstinencia") return;
        const start = toLocalDateStr(new Date(r.created_at));
        const next = rows[idx + 1];
        intervals.push({
          start,
          end: next ? toLocalDateStr(new Date(next.created_at)) : null,
        });
      });

      return { atual, intervals };
    },
  });

  const isReducao = (journey?.atual ?? "reducao") !== "abstinencia";

  const isAbstinenceDay = useMemo(() => {
    const intervals = journey?.intervals ?? [];
    return (ds: string) =>
      intervals.some((i) => ds >= i.start && (i.end === null || ds < i.end));
  }, [journey]);

  const firstName = (profile?.display_name || "").split(" ")[0] || "";

  // Baseline (from onboarding, excluding vape) — used for the chart line
  const baseline = onboarding?.cigarettes_per_day ?? 0;
  // For potential savings we include vape equivalents (same math as Dashboard)
  const vapesPerMonth = onboarding?.vapes_per_month ?? 0;
  const equivCigsPerDay = baseline + Math.ceil(vapesPerMonth / 30);
  const weeklyCostNum = (() => {
    // Se passar de 999, assume que a pessoa digitou com centavos (ex.: "5500" = R$ 55,00)
    const norm = (n: number) => (n > 999 ? Math.round(n / 100) : n);
    const v = onboarding?.weekly_cost_value;
    if (typeof v === "number" && isFinite(v) && v > 0) return norm(v);
    const txt = onboarding?.weekly_cost;
    if (!txt) return 0;
    const parsed = parseFloat(String(txt).replace(",", "."));
    return isFinite(parsed) && parsed > 0 ? norm(parsed) : 0;
  })();
  const costPerCig = baseline > 0 ? weeklyCostNum / 7 / baseline : 0;

  // Dias sem fumar, contados desde a data informada do último cigarro.
  const smokeFreeDays = useMemo(() => {
    const raw = onboarding?.last_cigarette_date as string | undefined;
    if (!raw) return null;
    let startStr = String(raw).slice(0, 10);
    // Se o usuário registrou que fumou depois da data informada, o último
    // input dele tem prioridade e a contagem reinicia nesse dia.
    const lastSmoked = logs
      .filter((l) => l.cigarettes_count > 0 && l.log_date > startStr)
      .map((l) => l.log_date)
      .sort()
      .pop();
    if (lastSmoked) startStr = lastSmoked;
    const start = new Date(startStr + "T00:00:00");
    if (isNaN(start.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - start.getTime()) / 86_400_000);
    return diff >= 0 ? diff : null;
  }, [onboarding?.last_cigarette_date, logs]);

  const lastCigLabel = useMemo(() => {
    const raw = onboarding?.last_cigarette_date as string | undefined;
    if (!raw) return null;
    const d = new Date(String(raw).slice(0, 10) + "T00:00:00");
    if (isNaN(d.getTime())) return null;
    return format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  }, [onboarding?.last_cigarette_date]);

  const openDateDialog = () => {
    const raw = onboarding?.last_cigarette_date as string | undefined;
    const d = raw ? new Date(String(raw).slice(0, 10) + "T00:00:00") : undefined;
    setPendingDate(d && !isNaN(d.getTime()) ? d : undefined);
    setDateDialogOpen(true);
  };

  const saveLastCigDate = async (dateStr: string) => {
    if (!user) return;
    setSavingDate(true);
    const { error } = await supabase
      .from("onboarding_responses")
      .update({ last_cigarette_date: dateStr })
      .eq("user_id", user.id);
    setSavingDate(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Data atualizada!" });
    refetchOnboarding?.();
  };

  const potential = useMemo(() => ({
    cigsMonth: equivCigsPerDay * 30,
    cigsYear: equivCigsPerDay * 365,
    moneyMonth: weeklyCostNum * 4,
    moneyYear: weeklyCostNum * 52,
  }), [equivCigsPerDay, weeklyCostNum]);

  // Start from the onboarding completion date (the user's declared "início").
  // Convert the UTC timestamp stored in Supabase to the user's local date so
  // the graph starts on the correct calendar day.
  const startDateStr: string | undefined = (() => {
    if (onboarding?.completed_at) {
      return toLocalDateStr(new Date(onboarding.completed_at));
    }
    return logs.length ? logs[0].log_date : undefined;
  })();

  // Ignore registros antigos quando o usuário refez o onboarding: o gráfico e
  // as métricas precisam refletir a jornada iniciada na última resposta.
  const activeLogs = useMemo(
    () => (startDateStr ? logs.filter((l) => l.log_date >= startDateStr) : logs),
    [logs, startDateStr],
  );

  // Build a continuous timeline from onboarding date to today.
  // `count` is always filled (carry forward last known log; baseline before
  // the first log) so the chart line is never broken. `logged` marks whether
  // the value came from a real user log — used to render dots only on those
  // days.
  const chartData = useMemo(() => {
    if (!startDateStr)
      return [] as {
        date: string;
        label: string;
        count: number;
        logged: boolean;
        baseline: number;
      }[];
    const start = new Date(startDateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: {
      date: string;
      label: string;
      count: number;
      logged: boolean;
      baseline: number;
    }[] = [];
    const logsByDate = new Map(activeLogs.map((l) => [l.log_date, l.cigarettes_count]));

    const cursor = new Date(start);
    let i = 0;
    let carry = baseline;
    // Hard safety cap to avoid runaway loops on corrupt dates; 5 years is more
    // than enough for the program and won't clip real usage.
    while (cursor <= today && i < 1830) {
      const ds = toLocalDateStr(cursor);
      const inLog = logsByDate.get(ds);
      if (inLog !== undefined) carry = inLog;
      // O registro do usuário sempre tem prioridade: mesmo na jornada de
      // liberdade, se ele informou que fumou, o gráfico mostra esse valor.
      const abst = inLog === undefined && isAbstinenceDay(ds);
      days.push({
        date: ds,
        label: format(cursor, "dd/MM"),
        count: abst ? 0 : carry,
        logged: abst || inLog !== undefined || i === 0,
        baseline,
      });
      cursor.setDate(cursor.getDate() + 1);
      i++;
    }
    return days;
  }, [startDateStr, activeLogs, baseline, isAbstinenceDay]);

  // Compute stats considering the WHOLE period between onboarding and yesterday.
  // For days without a log we carry forward the user's last known daily count
  // (before any log this defaults to the baseline), so gaps don't wipe out
  // legitimate reductions on either side.
  const stats = useMemo(() => {
    let avoided = 0;
    let daysWithLog = 0;
    let totalSmoked = 0;

    const logsByDate = new Map(activeLogs.map((l) => [l.log_date, l.cigarettes_count]));
    const todayStr = toLocalDateStr(new Date());

    let carry = baseline;
    // Skip the very first day (day the user set the baseline)
    for (let idx = 1; idx < chartData.length; idx++) {
      const d = chartData[idx];
      if (d.date === todayStr) continue; // today isn't complete yet
      const logged = logsByDate.get(d.date);
      if (logged !== undefined) {
        carry = logged;
        daysWithLog += 1;
      }
      const effective =
        logged === undefined && isAbstinenceDay(d.date) ? 0 : carry;
      totalSmoked += effective;
      avoided += Math.max(0, baseline - effective);
    }

    // Average of the last 3 calendar days ending on the most-recent logged day.
    // Computed directly from `logs` (with carry-forward) so it doesn't depend
    // on the chart window and always reflects the latest entry.
    const sortedLogs = [...activeLogs].sort((a, b) =>
      a.log_date.localeCompare(b.log_date),
    );
    const lastLog = sortedLogs[sortedLogs.length - 1];
    let avgPerDay = 0;
    if (lastLog) {
      const end = new Date(lastLog.log_date + "T00:00:00");
      const values: number[] = [];
      let carryAvg = baseline;
      // Walk from earliest log day up to lastLog, keeping carry-forward, then
      // take the last 3 days of that walk.
      const walkStart = new Date(sortedLogs[0].log_date + "T00:00:00");
      const walkCursor = new Date(walkStart);
      const walkLogs = new Map(sortedLogs.map((l) => [l.log_date, l.cigarettes_count]));
      while (walkCursor <= end) {
        const ds = toLocalDateStr(walkCursor);
        const v = walkLogs.get(ds);
        if (v !== undefined) carryAvg = v;
        values.push(v === undefined && isAbstinenceDay(ds) ? 0 : carryAvg);
        walkCursor.setDate(walkCursor.getDate() + 1);
      }
      const last3 = values.slice(-3);
      if (last3.length > 0) {
        avgPerDay = last3.reduce((s, n) => s + n, 0) / last3.length;
      }
    }

    return {
      avoided,
      money: avoided * costPerCig,
      daysWithLog,
      totalSmoked,
      avgPerDay,
    };
  }, [chartData, baseline, costPerCig, activeLogs, isAbstinenceDay]);

  // Has the user already logged yesterday?
  const yesterdayLogged = useMemo(
    () => activeLogs.some((l) => l.log_date === yesterdayStr()),
    [activeLogs],
  );

  // Date-picker bounds for the "pick any past day" flow
  const pickerMin = startDateStr ?? "";
  const pickerMax = yesterdayStr();
  const [customDate, setCustomDate] = useState<string>("");

  const handleLogout = async () => {
    await performLogout(navigate);
  };

  const openDialog = (date?: string) => {
    setDialogDate(date);
    setDialogOpen(true);
  };

  if (authLoading || profileLoading || onbLoading || logsLoading) {
    return <PageLoader />;
  }
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-32">
      <WaveBackground />

      <div className="mx-auto max-w-md animate-page-in px-5 pt-[env(safe-area-inset-top)]">
        {/* Header */}
        <header className="flex items-center justify-between pt-4">
          <img src={soproLogo} alt="Sopro Neuro" className="h-10 w-auto" />
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground leading-tight">
                {getGreeting()}
                {firstName ? `, ${firstName}!` : "!"}
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Cada registro é um<br />passo de consciência.
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-10 w-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-[0_4px_14px_-4px_hsl(220_40%_40%/0.18)] ring-1 ring-black/[0.03]">
                  <User className="h-5 w-5 text-primary" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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

        {/* Title */}
        <div className="mt-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-[hsl(220_90%_55%)] to-[hsl(258_70%_55%)] bg-clip-text text-transparent">
            Seu progresso
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Acompanhe a redução do seu consumo dia após dia.
          </p>
        </div>

        {/* Smoke free counter */}
        {!isReducao && smokeFreeDays !== null && (
          <Card className="mt-5 overflow-hidden border-0 rounded-3xl bg-gradient-to-br from-[hsl(258_80%_60%)] to-[hsl(230_85%_60%)] p-5 text-white shadow-[0_18px_50px_-18px_hsl(258_70%_45%/0.5)]">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-end justify-center gap-2">
                <span className="text-6xl font-bold leading-none tracking-tight">
                  {smokeFreeDays}
                </span>
                <span className="pb-1.5 text-base font-medium opacity-90">
                  {smokeFreeDays === 1 ? "dia" : "dias"}
                </span>
              </div>
              <p className="mt-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] opacity-85">
                Sem fumar
              </p>
              <div className="mt-3 flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">
                <CalendarIcon className="h-3.5 w-3.5 opacity-90" />
                <span className="text-[11px] font-medium">
                  Último cigarro em {lastCigLabel}
                </span>
                <button
                  onClick={openDateDialog}
                  aria-label="Alterar a data do último cigarro"
                  className="flex min-h-[24px] min-w-[24px] items-center justify-center rounded-full opacity-80 transition-transform active:scale-95"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Savings — cigs avoided + money saved */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <StatCard
            icon={<Cigarette className="h-4 w-4" />}
            label="Cigarros evitados"
            value={stats.avoided.toLocaleString("pt-BR")}
          />
          <StatCard
            icon={<DollarSign className="h-4 w-4" />}
            label="Dinheiro economizado"
            value={formatBRL(stats.money)}
          />
        </div>

        <button
          onClick={() => setConsumoDialogOpen(true)}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-semibold text-[hsl(258_60%_50%)] active:scale-[0.99] transition-transform"
        >
          <Pencil className="h-3 w-3" />
          Editar meu consumo e gasto
        </button>


        {/* Register CTA — only when yesterday hasn't been logged */}
        {!yesterdayLogged && (
          <button
            onClick={() => openDialog(yesterdayStr())}
            className="mt-4 w-full rounded-2xl bg-gradient-to-br from-[hsl(258_80%_60%)] to-[hsl(230_85%_60%)] p-4 text-left text-white shadow-[0_14px_38px_-14px_hsl(258_70%_45%/0.55)] active:scale-[0.99] transition-transform flex items-center gap-3"
          >
            <div className="h-11 w-11 rounded-full bg-white/20 flex items-center justify-center backdrop-blur">
              <Plus className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight">Registrar ontem</p>
              <p className="text-[11px] text-white/85 leading-snug mt-0.5">
                Quantos cigarros você fumou ontem?
              </p>
            </div>
            <ChevronRight className="h-5 w-5 opacity-80" />
          </button>
        )}

        {/* Chart */}
        <Card className="mt-5 p-4 bg-white/90 backdrop-blur-md border-0 shadow-[0_18px_50px_-18px_hsl(230_60%_40%/0.22)] ring-1 ring-black/[0.03] rounded-3xl">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-sm">
              Cigarros por dia
            </h3>
            {stats.avoided > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-[hsl(140_60%_95%)] px-2.5 py-1 text-[11px] font-semibold text-[hsl(140_50%_35%)]">
                <TrendingDown className="h-3 w-3" />
                em queda
              </div>
            )}
          </div>

          {/* Start & current average stats — prominently placed right above the chart */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-[hsl(220_30%_97%)] p-3 text-center ring-1 ring-black/[0.03]">
              <p className="text-[11px] text-muted-foreground">Início</p>
              <p className="text-lg font-bold text-foreground leading-tight mt-0.5">
                {baseline}
                <span className="text-xs font-medium text-muted-foreground">/dia</span>
              </p>
            </div>
            <div className="rounded-2xl bg-[hsl(258_70%_97%)] p-3 text-center ring-1 ring-black/[0.03]">
              <p className="text-[11px] text-[hsl(258_50%_40%)]">Média atual (3 dias)</p>
              <p className="text-lg font-bold text-[hsl(258_60%_40%)] leading-tight mt-0.5">
                {stats.daysWithLog > 0 ? stats.avgPerDay.toFixed(1) : "—"}
                <span className="text-xs font-medium text-[hsl(258_40%_50%)]">/dia</span>
              </p>
            </div>
          </div>

          <div className="mt-3 h-52 -mx-2">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                Complete o onboarding para começar o acompanhamento.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 5, right: 12, bottom: 0, left: -10 }}
                >
                  <defs>
                    <linearGradient id="cigFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(258 80% 60%)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(258 80% 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 30% 92%)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "hsl(220 15% 55%)" }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    minTickGap={20}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(220 15% 55%)" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={30}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid hsl(258 70% 92%)",
                      fontSize: 12,
                    }}
                    formatter={(v: any) =>
                      v === null || v === undefined ? ["—", "cigarros"] : [v, "cigarros"]
                    }
                    labelFormatter={(l) => `Dia ${l}`}
                  />
                  {baseline > 0 && (
                    <ReferenceLine
                      y={baseline}
                      stroke="hsl(220 15% 65%)"
                      strokeDasharray="4 4"
                      label={{
                        value: "Início",
                        position: "insideTopRight",
                        fill: "hsl(220 15% 55%)",
                        fontSize: 10,
                      }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(258 80% 55%)"
                    strokeWidth={2.5}
                    fill="url(#cigFill)"
                    connectNulls
                    dot={(props: any) => {
                      const { cx, cy, payload, index } = props;
                      if (cx == null || cy == null) return <g key={`d-${index}`} />;
                      return (
                        <circle
                          key={`d-${index}`}
                          cx={cx}
                          cy={cy}
                          r={payload?.logged ? 3.5 : 0}
                          fill="hsl(258 80% 55%)"
                        />
                      );
                    }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Backfill any past day — open date picker */}
          {startDateStr && (
            <div className="mt-4 pt-4 border-t border-[hsl(220_30%_94%)]">
              <div className="flex items-center gap-2">
                <Pencil className="h-3.5 w-3.5 text-[hsl(258_60%_50%)]" />
                <p className="text-xs font-semibold text-foreground">
                  Registrar outro dia
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Escolha uma data para registrar quantos cigarros fumou.
              </p>
              <div className="mt-2.5 flex items-stretch gap-2">
                <input
                  type="date"
                  value={customDate}
                  min={pickerMin}
                  max={pickerMax}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="flex-1 min-w-0 rounded-xl bg-white px-3 py-2.5 text-sm shadow-[inset_0_0_0_1px_hsl(258_70%_92%)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_70%_70%)]"
                />
                <button
                  disabled={!customDate}
                  onClick={() => {
                    if (!customDate) return;
                    openDialog(customDate);
                    setCustomDate("");
                  }}
                  className="rounded-xl bg-gradient-to-br from-[hsl(258_80%_60%)] to-[hsl(230_85%_60%)] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_hsl(258_70%_45%/0.6)] active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
                >
                  Registrar
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Potencial ao parar de fumar — moved to the end */}
        {equivCigsPerDay > 0 && (
          <Card className="mt-5 p-4 bg-white/90 backdrop-blur-md border-0 shadow-[0_14px_40px_-16px_hsl(258_70%_45%/0.22)] ring-1 ring-black/[0.03] rounded-3xl">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(258_80%_60%)] to-[hsl(230_85%_60%)] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <TrendingDown className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm leading-tight">
                  Seu potencial ao parar de fumar
                </h3>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  O quanto você deixa de fumar e economiza.
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <PotentialTile
                label="Cigarros / mês"
                value={potential.cigsMonth.toLocaleString("pt-BR")}
              />
              <PotentialTile
                label="Cigarros / ano"
                value={potential.cigsYear.toLocaleString("pt-BR")}
              />
              <PotentialTile
                label="Economia / mês"
                value={formatBRLCompact(potential.moneyMonth)}
                accent
              />
              <PotentialTile
                label="Economia / ano"
                value={formatBRLCompact(potential.moneyYear)}
                accent
              />
            </div>

            <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <span>
                Base: {cigsPerDay} cigarros/dia · {vapesPerMonth} vapes/mês · {formatBRLCompact(weeklyCostNum)}/semana
              </span>
              <button
                onClick={() => setConsumoDialogOpen(true)}
                aria-label="Editar consumo e gasto"
                className="p-1 rounded-md text-[hsl(258_60%_50%)] active:scale-95 transition-transform"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
          </Card>
        )}

        {!startDateStr && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Complete o onboarding para começar seu acompanhamento diário.
          </p>
        )}
      </div>

      <BottomNav />

      <SmokingLogDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        logDate={dialogDate}
        title={
          dialogDate && dialogDate !== yesterdayStr()
            ? `Quantos cigarros em ${format(new Date(dialogDate + "T00:00:00"), "dd/MM")}?`
            : undefined
        }
      />

      <ConsumptionEditDialog
        open={consumoDialogOpen}
        onOpenChange={setConsumoDialogOpen}
        cigarettesPerDay={onboarding?.cigarettes_per_day ?? null}
        vapesPerMonth={onboarding?.vapes_per_month ?? null}
        weeklyCost={weeklyCostNum}
        onSaved={() => refetchOnboarding?.()}
      />


      <Dialog open={dateDialogOpen} onOpenChange={setDateDialogOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-0 overflow-hidden border-0 bg-white shadow-[0_24px_60px_-20px_hsl(258_60%_40%/0.4)]">
          <div className="bg-gradient-to-br from-[hsl(258_80%_97%)] to-[hsl(220_80%_97%)] px-5 pt-5 pb-4">
            <DialogHeader className="text-left space-y-1">
              <div className="h-10 w-10 rounded-2xl bg-white text-[hsl(258_60%_50%)] flex items-center justify-center shadow-sm mb-2">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <DialogTitle className="text-base font-bold text-foreground text-balance">
                Data do último cigarro
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground text-balance">
                Ajuste o dia em que você fumou pela última vez.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-3 py-3 flex justify-center">
            <Calendar
              mode="single"
              selected={pendingDate}
              onSelect={setPendingDate}
              locale={ptBR}
              disabled={(d) => d > new Date()}
              initialFocus
              className="rounded-xl"
            />
          </div>
          <DialogFooter className="px-5 pb-5 pt-1 flex-row gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setDateDialogOpen(false)}
              disabled={savingDate}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 rounded-xl bg-gradient-to-br from-[hsl(258_70%_55%)] to-[hsl(280_70%_60%)] text-white shadow-md"
              disabled={!pendingDate || savingDate}
              onClick={async () => {
                if (!pendingDate) return;
                await saveLastCigDate(toLocalDateStr(pendingDate));
                setDateDialogOpen(false);
              }}
            >
              {savingDate ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-[hsl(258_80%_98%)] to-[hsl(220_80%_98%)] p-3.5 shadow-[0_6px_20px_-12px_hsl(258_70%_45%/0.25)] ring-1 ring-black/[0.03]">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-white text-[hsl(258_60%_50%)] flex items-center justify-center flex-shrink-0 shadow-sm">
          {icon}
        </div>
        <p className="text-[11px] font-medium text-foreground leading-tight">
          {label}
        </p>
      </div>
      <p className="mt-2 text-xl font-bold text-[hsl(258_60%_45%)] tabular-nums">
        {value}
      </p>
    </div>
  );
}

function PotentialTile({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        accent
          ? "rounded-xl bg-gradient-to-br from-[hsl(140_65%_96%)] to-[hsl(160_70%_96%)] px-3 py-2.5 ring-1 ring-[hsl(140_50%_88%)]"
          : "rounded-xl bg-[hsl(258_80%_98%)] px-3 py-2.5 ring-1 ring-[hsl(258_70%_92%)]"
      }
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={
          "mt-1 text-lg font-bold tabular-nums " +
          (accent ? "text-[hsl(140_50%_32%)]" : "text-[hsl(258_60%_45%)]")
        }
      >
        {value}
      </p>
    </div>
  );
}