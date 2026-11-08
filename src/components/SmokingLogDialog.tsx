import { useState } from "react";
import { Cigarette, Loader2, ArrowRight } from "lucide-react";
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
      <DialogContent className="max-h-[88dvh] w-[calc(100%-1.5rem)] max-w-sm gap-0 overflow-y-auto overscroll-contain rounded-3xl border-0 bg-background p-0 shadow-primary [&>button]:right-4 [&>button]:top-4 [&>button]:flex [&>button]:h-11 [&>button]:w-11 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:bg-card [&>button]:text-muted-foreground [&>button]:opacity-100">
        <DialogHeader className="space-y-3 bg-gradient-to-br from-lilac-soft/80 to-card px-5 pb-5 pt-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-method shadow-wellness">
            <Cigarette className="h-6 w-6 text-primary-foreground" />
          </div>
          <DialogTitle className="text-balance text-center text-lg font-bold leading-tight text-electric-blue">
            {title ?? "Quantos cigarros você fumou ontem?"}
          </DialogTitle>
          <DialogDescription className="text-balance text-center text-sm font-medium text-muted-foreground">
            {description ?? "Seu registro honesto é o combustível da sua evolução."}
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pb-5 pt-4">
          <div className="grid grid-cols-4 gap-2">
            {QUICK_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setSelected(n)}
                className={`h-12 rounded-2xl text-base font-bold transition-all active:scale-95 ${
                  selected === n
                    ? "bg-gradient-method text-primary-foreground shadow-wellness"
                    : "bg-lilac-soft text-foreground"
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <label className="text-sm font-semibold text-muted-foreground">
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
              className="mt-1.5 w-full rounded-2xl bg-lilac-soft/60 px-4 py-3 text-base font-semibold text-foreground placeholder:font-normal placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-lilac/50"
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
            className="mt-5 h-12 w-full rounded-full bg-gradient-method text-base font-bold text-primary-foreground shadow-wellness transition-transform active:scale-95 disabled:bg-none disabled:bg-secondary disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
          </Button>

          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="mt-2 h-auto min-h-11 w-full gap-2 rounded-full text-sm font-semibold text-electric-blue hover:bg-lilac-soft hover:text-electric-blue"
          >
            Prefiro registrar depois<ArrowRight aria-hidden className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
