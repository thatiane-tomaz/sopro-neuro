import { useEffect, useState } from "react";
import { Loader2, Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cigarettesPerDay?: number | null;
  vapesPerMonth?: number | null;
  weeklyCost?: number | null;
  onSaved?: () => void;
}

const onlyDigits = (v: string) => v.replace(/\D/g, "").slice(0, 5);

// Se passar de 999, assume que a pessoa digitou com centavos (ex.: "5500" = R$ 55,00)
export const normalizeWeeklyCost = (n: number): number =>
  Number.isFinite(n) && n > 999 ? Math.round(n / 100) : n;

export default function ConsumptionEditDialog({
  open,
  onOpenChange,
  cigarettesPerDay,
  vapesPerMonth,
  weeklyCost,
  onSaved,
}: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cigs, setCigs] = useState("");
  const [vapes, setVapes] = useState("");
  const [cost, setCost] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCigs(cigarettesPerDay != null ? String(cigarettesPerDay) : "");
    setVapes(vapesPerMonth != null ? String(vapesPerMonth) : "");
    setCost(weeklyCost != null && weeklyCost > 0 ? String(Math.round(weeklyCost)) : "");
  }, [open, cigarettesPerDay, vapesPerMonth, weeklyCost]);

  const costNormalized = normalizeWeeklyCost(Number(cost || "0"));
  const valid =
    cigs.trim() !== "" &&
    cost.trim() !== "" &&
    Number(cigs) <= 200 &&
    Number(vapes || "0") <= 200 &&
    costNormalized <= 999;

  const save = async () => {
    if (!user || !valid) return;
    setSaving(true);
    try {
      const cigsNum = parseInt(cigs, 10);
      const vapesNum = parseInt(vapes || "0", 10);
      const costNum = normalizeWeeklyCost(parseInt(cost, 10));

      const { error } = await supabase
        .from("onboarding_responses")
        .update({
          cigarettes_per_day: cigsNum,
          vapes_per_month: vapesNum,
          weekly_cost: String(costNum),
          weekly_cost_value: costNum,
        })
        .eq("user_id", user.id);
      if (error) throw error;

      const { data: v2 } = await supabase
        .from("onboarding_responses_v2")
        .select("id, respostas")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (v2?.id) {
        const respostas = {
          ...((v2.respostas as Record<string, unknown>) ?? {}),
          cigarettesPerDay: String(cigsNum),
          vapesPerMonth: String(vapesNum),
          weeklyCost: String(costNum),
        };
        await supabase
          .from("onboarding_responses_v2")
          .update({ respostas } as any)
          .eq("id", v2.id);
      }

      toast({ title: "Informações atualizadas!" });
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      toast({
        title: "Erro ao salvar",
        description: e?.message ?? "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl border-0 bg-white p-6 shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="mx-auto h-12 w-12 rounded-full bg-gradient-to-br from-[hsl(258_80%_60%)] to-[hsl(230_85%_60%)] flex items-center justify-center shadow-lg">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-center text-lg font-bold text-balance">
            Seu consumo e seu gasto
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-balance">
            Ajuste os números para que sua economia fique correta.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-1 space-y-3">
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Cigarros por dia
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={cigs}
              onChange={(e) => setCigs(onlyDigits(e.target.value))}
              placeholder="Ex.: 15"
              className="mt-1 w-full rounded-xl bg-white px-3 py-2.5 text-base shadow-[inset_0_0_0_1px_hsl(258_70%_92%)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_70%_70%)]"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Vapes por mês
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={vapes}
              onChange={(e) => setVapes(onlyDigits(e.target.value))}
              placeholder="Ex.: 0"
              className="mt-1 w-full rounded-xl bg-white px-3 py-2.5 text-base shadow-[inset_0_0_0_1px_hsl(258_70%_92%)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_70%_70%)]"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Gasto por semana (em reais)
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                R$
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={cost}
                onChange={(e) => setCost(onlyDigits(e.target.value))}
                placeholder="Ex.: 55"
                className="w-full rounded-xl bg-white pl-10 pr-3 py-2.5 text-base shadow-[inset_0_0_0_1px_hsl(258_70%_92%)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_70%_70%)]"
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Somente reais inteiros, sem centavos. Ex.: 55 = R$ 55,00
            </p>
          </div>
        </div>

        <Button
          disabled={saving || !valid}
          onClick={save}
          className="mt-4 h-12 w-full rounded-xl bg-gradient-to-br from-[hsl(258_80%_60%)] to-[hsl(230_85%_60%)] text-base font-bold shadow-md active:scale-95 transition-transform"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
