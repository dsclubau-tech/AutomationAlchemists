import type { LabelDetails } from "@/types";

interface DetailsFormProps {
  details: LabelDetails;
  onChange: (details: LabelDetails) => void;
  showItemFields?: boolean;
}

export function DetailsForm({ details, onChange, showItemFields = true }: DetailsFormProps) {
  return (
    <div className="space-y-6">
      {showItemFields ? (
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="itemName">
            Item description
          </label>
          <textarea
            id="itemName"
            rows={4}
            value={details.itemName}
            onChange={(event) => onChange({ ...details, itemName: event.target.value })}
            placeholder="e.g. Gawfolk 32 inch 4K PC Monitor, UHD 3840 x 2160p 60HZ..."
            className="min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 shadow-sm transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none"
          />
        </div>
      ) : null}

      <div className={showItemFields ? "grid gap-5 sm:grid-cols-[140px_1fr]" : "space-y-1.5"}>
        {showItemFields ? (
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="quantity">
              Quantity
            </label>
            <input
              id="quantity"
              min="1"
              type="number"
              value={details.quantity}
              onChange={(event) => onChange({ ...details, quantity: event.target.value })}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 shadow-sm transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none"
            />
          </div>
        ) : null}

        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="orderRef">
            eBay order reference
          </label>
          <input
            id="orderRef"
            value={details.orderRef}
            onChange={(event) => onChange({ ...details, orderRef: event.target.value })}
            placeholder="Optional reference number"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 shadow-sm transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none"
          />
        </div>
      </div>
    </div>
  );
}

