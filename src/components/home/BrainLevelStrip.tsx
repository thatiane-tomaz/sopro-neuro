import { useNavigate } from "react-router-dom";
import lv1 from "@/assets/brain/brain-lv1-active.png";
import lv2 from "@/assets/brain/brain-lv2-active.png";
import lv3 from "@/assets/brain/brain-lv3-active.png";
import lv4 from "@/assets/brain/brain-lv4-active.png";
import lv5 from "@/assets/brain/brain-lv5-active.png";
import { useBrainLevels, type BrainLevel } from "@/hooks/useBrainSparks";

const IMAGES: Record<BrainLevel, string> = {
  1: lv1,
  2: lv2,
  3: lv3,
  4: lv4,
  5: lv5,
};

// Warm the browser cache with the 5 level images at module load so they
// appear instantly on the Progresso tab (no network wait on first paint).
if (typeof window !== "undefined") {
  for (const url of Object.values(IMAGES)) {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
  }
}

interface Props {
  currentLevel: BrainLevel;
  sparks: number;
}

export default function BrainLevelStrip({ currentLevel, sparks }: Props) {
  const navigate = useNavigate();
  const ranges = useBrainLevels();
  const levels: BrainLevel[] = [1, 2, 3, 4, 5];

  return (
    <button
      type="button"
      onClick={() => navigate("/cerebro")}
      className="w-full text-left rounded-3xl bg-white/85 backdrop-blur-md ring-1 ring-black/[0.04] shadow-[0_10px_28px_-14px_hsl(230_60%_40%/0.22)] p-3 active:scale-[0.99] transition-transform"
      aria-label={`Evolução do Neo. Você está no nível ${currentLevel} com ${sparks} sparks. Toque para ver detalhes.`}
    >
      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] bg-gradient-to-r from-[hsl(220_90%_55%)] to-[hsl(258_70%_55%)] bg-clip-text text-transparent">
          Evolução do Neo
        </p>
        <span className="text-[10px] font-semibold text-muted-foreground">
          {sparks} sparks
        </span>
      </div>
      <div className="mt-2 grid grid-cols-5 gap-1">
        {levels.map((lv) => {
          const isCurrent = lv === currentLevel;
          const isPast = lv < currentLevel;
          return (
            <div key={lv} className="flex flex-col items-center gap-1">
              <div
                className={`relative flex items-center justify-center rounded-full transition-all ${
                  isCurrent
                    ? "ring-2 ring-[hsl(258_70%_55%)] bg-gradient-to-br from-[hsl(220_90%_96%)] to-[hsl(258_70%_96%)] shadow-[0_6px_18px_-6px_hsl(258_70%_45%/0.45)]"
                    : "bg-[hsl(220_30%_97%)] ring-1 ring-black/[0.03]"
                }`}
                style={{ width: 52, height: 52 }}
              >
                <img
                  src={IMAGES[lv]}
                  alt={`Neo nível ${lv}`}
                  width={44}
                  height={44}
                  className={`object-contain ${
                    !isCurrent && !isPast ? "opacity-55 grayscale-[0.25]" : ""
                  }`}
                  style={{ width: 44, height: 44 }}
                  loading="eager"
                  draggable={false}
                />
              </div>
              <span
                className={`text-[10px] font-bold tabular-nums leading-none ${
                  isCurrent ? "text-[hsl(258_60%_45%)]" : "text-muted-foreground"
                }`}
              >
                {ranges[lv].min}+
              </span>
            </div>
          );
        })}
      </div>
    </button>
  );
}