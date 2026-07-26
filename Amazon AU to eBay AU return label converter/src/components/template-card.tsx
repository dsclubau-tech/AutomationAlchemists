import { Barcode, FileImage, QrCode, Truck } from "lucide-react";
import type { LabelTemplate } from "@/types";
import { cn } from "@/lib/utils";

interface TemplateCardProps {
  template: LabelTemplate;
  selected: boolean;
  onSelect: () => void;
}

function TemplateIcon({ codeType }: { codeType: LabelTemplate["codeType"] }) {
  if (codeType === "qr") {
    return <QrCode className="h-5 w-5" aria-hidden="true" />;
  }

  if (codeType === "barcode") {
    return <Barcode className="h-5 w-5" aria-hidden="true" />;
  }

  return <FileImage className="h-5 w-5" aria-hidden="true" />;
}

export function TemplateCard({ template, selected, onSelect }: TemplateCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col justify-between min-h-[140px] rounded-xl border p-5 text-left transition-all duration-300 hover-lift",
        selected
          ? "bg-white border-transparent ring-2 shadow-panel"
          : "border-line bg-white/60 backdrop-blur-sm hover:border-neutral-400/80 hover:bg-white",
      )}
      style={{
        boxShadow: selected ? `0 10px 25px -5px ${template.accent}15, 0 8px 10px -6px ${template.accent}10, 0 0 0 2px ${template.accent}` : undefined,
      }}
    >
      <div className="flex w-full items-start justify-between gap-3">
        <div
          className="grid h-11 w-11 place-items-center rounded-xl text-white shadow-sm transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: template.accent }}
        >
          <TemplateIcon codeType={template.codeType} />
        </div>
        {selected ? (
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm"
            style={{ backgroundColor: template.accent }}
          >
            Active
          </span>
        ) : null}
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-bold text-slate-800 leading-snug group-hover:text-slate-900">
          {template.name}
        </h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Truck className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
          {template.type}
        </p>
      </div>
    </button>
  );
}

