import { useState } from "react";
import { Cigarette, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSmokingLogs, yesterdayStr } from "@/hooks/useSmokingLogs";
import { useToast } from "@/hooks/use-toast";

const QUICK_OPTIONS = [0, 1, 3, 5, 8, 12, 15, 20];

export default function SmokingLogDialog({
  open,
  onOpenChange,
  logDate,
  title,
  description,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logDate?: string;
  title?: string;
  description?: string;
}) {
  const { upsert, isSaving } = useSmokingLogs();
  const { toast } = useToast();
  const [custom, setCustom] = useState<string>("");
  const [selected, setSelected] = useState<number | null>(null);

  const targetDate = logDate ?? yesterdayStr();

  const save = async (count: number) => {
    try {
      await upsert({ logDate: targetDate, count });
      toast({ title: "Registro salvo", description: `${count} cigarro(s) em ${targetDate}` });
      onOpenChange(false);
      setCustom("");
      setSelected(null);
    } catch (e: any) {
      toast({
        title: "Erro ao salvar",
        description: e?.message ?? "Tente novamente",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl border-0 bg-white p-6 shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="mx-auto h-12 w-12 rounded-full bg-gradient-to-br from-[hsl(258_80%_60%)] to-[hsl(230_85%_60%)] flex items-center justify-center shadow-lg">
            <Cigarette className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-center text-lg font-bold">
            {title ?? "Quantos cigarros você fumou ontem?"}
          </DialogTitle>
          <DialogDescription className="text-center text-xs">
            {description ?? "Seu registro honesto é o combustível da sua evolução."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 grid grid-cols-4 gap-2">
          {QUICK_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setSelected(n)}
              className={`h-12 rounded-xl text-base font-bold transition-all active:scale-95 ${
                selected === n
                  ? "bg-gradient-to-br from-[hsl(258_80%_60%)] to-[hsl(230_85%_60%)] text-white shadow-md ring-2 ring-[hsl(258_70%_88%)]"
                  : "bg-[hsl(258_80%_97%)] text-foreground ring-1 ring-[hsl(258_70%_92%)]"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="mt-3">
          <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Outro valor
          </label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={200}
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              setSelected(null);
            }}
            placeholder="Ex.: 7"
            className="mt-1 w-full rounded-xl bg-white px-3 py-2.5 text-sm shadow-[inset_0_0_0_1px_hsl(258_70%_92%)] focus:outline-none focus:ring-2 focus:ring-[hsl(258_70%_70%)]"
          />
        </div>

        <Button
          disabled={isSaving || (selected === null && !custom)}
          onClick={() => {
            const value =
              selected !== null ? selected : parseInt(custom || "0", 10);
            if (isNaN(value) || value < 0) return;
            save(value);
          }}
          className="mt-4 h-12 w-full rounded-xl bg-gradient-to-br from-[hsl(258_80%_60%)] to-[hsl(230_85%_60%)] text-base font-bold shadow-md active:scale-95 transition-transform"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
        </Button>

        <button
          onClick={() => onOpenChange(false)}
          className="mt-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Prefiro registrar depois
        </button>
      </DialogContent>
    </Dialog>
  );
}