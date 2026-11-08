import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Check, Lock, MessageCircle, Target } from "lucide-react";

interface MissionDialogProps {
  open: boolean;
  title: string;
  primary: string;
  secondary: string;
  done: boolean;
  locked: boolean;
  countdown: string | null;
  onClose: () => void;
  onChat: () => void;
}

export default function MissionDialog({ open, title, primary, secondary, done, locked, countdown, onClose, onChat }: MissionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) onClose(); }}>
      <DialogContent className="max-h-[calc(100dvh-3rem)] w-[calc(100%-2rem)] max-w-md gap-0 overflow-y-auto rounded-lg bg-background p-0">
        <DialogHeader className="space-y-2 border-b border-border px-5 pb-4 pt-5 text-left sm:text-left">
          <div className="flex items-center gap-2 text-primary"><Target className="h-5 w-5" /><span className="text-sm font-semibold">Sua missão</span></div>
          <DialogTitle className="pr-6 text-balance text-sm font-medium leading-snug text-muted-foreground">{title}</DialogTitle>
          <DialogDescription className="sr-only">Sua missão</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 px-5 py-5">
          <p className="text-pretty whitespace-pre-line text-xl font-semibold leading-snug text-foreground">{primary}</p>
          {secondary && <p className="text-pretty whitespace-pre-line text-sm font-medium leading-relaxed text-muted-foreground">{secondary}</p>}
          <div className="space-y-2">
            <Button className="h-auto min-h-11 w-full whitespace-normal py-3" disabled={locked || done} onClick={onChat}>
              {done ? <Check /> : locked ? <Lock /> : <MessageCircle />}
              {done ? "Missão concluída" : locked ? `Disponível em ${countdown ?? "breve"}` : "Concluir a missão"}
            </Button>
            <Button variant="ghost" className="min-h-11 w-full text-muted-foreground" onClick={onClose}>Ainda vou viver essa missão</Button>
          </div>
          {locked && !done && <p className="text-balance text-center text-sm font-medium leading-relaxed text-muted-foreground">Viva sua missão por 24 horas. Depois desse período, você poderá conversar com o Neo sobre a experiência.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}