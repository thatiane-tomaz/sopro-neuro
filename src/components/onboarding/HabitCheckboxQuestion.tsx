import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import OnboardingLayout from "./OnboardingLayout";

interface Props {
  title: string;
  subtitle?: string;
  options: { label: string; habito: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  onNext: () => void;
  onPrev: () => void;
  step: number;
  total: number;
  allowEmpty?: boolean;
}

const HabitCheckboxQuestion = ({
  title,
  subtitle,
  options,
  selected,
  onChange,
  onNext,
  onPrev,
  step,
  total,
  allowEmpty = true,
}: Props) => {
  const toggle = (label: string, checked: boolean) => {
    const next = checked
      ? [...(selected || []), label]
      : (selected || []).filter((l) => l !== label);
    onChange(next);
  };

  const canProceed = allowEmpty || (selected && selected.length > 0);

  return (
    <OnboardingLayout
      step={step}
      total={total}
      title={title}
      subtitle={subtitle}
      onNext={onNext}
      onPrev={onPrev}
      canProceed={!!canProceed}
    >
      <div className="grid gap-2 max-h-[52vh] overflow-y-auto pr-1 -mr-1">
        {options.map((opt, i) => {
          const isSelected = selected?.includes(opt.label);
          return (
            <Label
              key={i}
              htmlFor={`habit-${step}-${i}`}
              className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? "bg-primary/10 border-primary/40 shadow-sm"
                  : "bg-white/60 border-white/80 hover:bg-white/90"
              }`}
            >
              <Checkbox
                id={`habit-${step}-${i}`}
                checked={isSelected || false}
                onCheckedChange={(c) => toggle(opt.label, c as boolean)}
              />
              <span className="flex-1 text-sm">{opt.label}</span>
            </Label>
          );
        })}
      </div>
    </OnboardingLayout>
  );
};

export default HabitCheckboxQuestion;