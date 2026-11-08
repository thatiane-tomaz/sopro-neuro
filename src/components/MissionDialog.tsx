import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Check, Lock, MessageCircle, ArrowRight } from "lucide-react";
import missionImage from "@/assets/step-missao.webp";

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
      <DialogContent className="max-h-[calc(100dvh-3rem)] w-[calc(100%-1.5rem)] max-w-md gap-0 overflow-y-auto rounded-3xl border-border/40 bg-background p-0 shadow-primary sm:rounded-3xl [&>button]:right-4 [&>button]:top-4 [&>button]:flex [&>button]:h-11 [&>button]:w-11 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:bg-card [&>button]:text-muted-foreground [&>button]:opacity-100">
        <DialogHeader className="space-y-0 bg-gradient-to-br from-lilac-soft/80 to-card px-5 pb-5 pt-5 text-left sm:text-left">
          <div className="flex items-center gap-3 pr-10">
            <img src={missionImage} alt="" draggable={false} className="h-16 w-16 flex-shrink-0 object-contain" />
            <div className="min-w-0 space-y-1">
              <p className="text-lg font-bold leading-tight text-electric-blue">Sua missão</p>
              <DialogTitle className="text-balance text-sm font-medium leading-snug text-muted-foreground">{title}</DialogTitle>
            </div>
          </div>
          <DialogDescription className="sr-only">Sua missão</DialogDescription>
        </DialogHeader>
        <div className="px-5 pb-5 pt-1">
          <p className="text-pretty whitespace-pre-line text-xl font-semibold leading-snug text-foreground">{primary}</p>
          {secondary && <div className="mt-5 flex items-start gap-2.5 border-t border-lilac/15 pt-4">
            <MessageCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-lilac" aria-hidden />
            <p className="text-pretty whitespace-pre-line text-sm font-medium leading-relaxed text-muted-foreground">{secondary}</p>
          </div>}
          <div className="mt-6 space-y-2">
            <Button className="h-auto min-h-12 w-full whitespace-normal rounded-full bg-gradient-method py-3 text-sm font-bold text-primary-foreground shadow-wellness disabled:bg-none disabled:bg-secondary disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none" disabled={locked || done} onClick={onChat}>
              {done ? <Check /> : locked ? <Lock /> : <MessageCircle />}
              {done ? "Missão concluída" : locked ? `Disponível em ${countdown ?? "breve"}` : "Concluir a missão"}
            </Button>
            <Button variant="ghost" className="h-auto min-h-11 w-full gap-2 whitespace-normal rounded-full text-sm font-semibold text-electric-blue hover:bg-lilac-soft hover:text-electric-blue" onClick={onClose}>Ainda vou viver essa missão<ArrowRight aria-hidden /></Button>
          </div>
          {locked && !done && <p className="mt-3 text-balance text-center text-sm font-medium leading-relaxed text-muted-foreground">Viva sua missão por 24 horas. Depois desse período, você poderá conversar com o Neo sobre a experiência.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}