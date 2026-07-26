import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepDotProps {
  index: number;
  label: string;
  active: boolean;
  complete: boolean;
}

export function StepDot({ index, label, active, complete }: StepDotProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-full border text-xs font-bold transition-all duration-300 shadow-sm",
          complete && "border-emerald-500 bg-emerald-500 text-white shadow-emerald-100",
          active && !complete && "border-blue-500 bg-blue-500 text-white shadow-blue-100 ring-4 ring-blue-100 animate-pulse-soft",
          !active && !complete && "border-slate-200 bg-white text-slate-400",
        )}
        aria-current={active ? "step" : undefined}
      >
        {complete ? (
          <Check className="h-4.5 w-4.5 stroke-[3]" aria-hidden="true" />
        ) : (
          <span>{String(index + 1).padStart(2, "0")}</span>
        )}
      </div>
      <span
        className={cn(
          "hidden text-xs font-bold uppercase tracking-wider md:inline transition-colors duration-300",
          active ? "text-slate-800" : "text-slate-400",
        )}
      >
        {label}
      </span>
    </div>
  );
}

