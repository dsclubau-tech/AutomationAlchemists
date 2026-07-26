import type { LabelDetails, LabelTemplate } from "@/types";

interface LabelPreviewProps {
  template: LabelTemplate;
  details: LabelDetails;
  codeImage: string | null;
  secondaryImage?: string | null;
}

export function LabelPreview({ template, details, codeImage, secondaryImage }: LabelPreviewProps) {
  const itemName = details.itemName.trim();
  const quantity = details.quantity.trim() || "1";
  const orderRef = details.orderRef.trim();
  const imageClass =
    template.codeType === "label"
      ? "w-full max-h-[500px] object-contain border border-neutral-300 rounded-lg shadow-sm"
      : template.codeType === "barcode"
        ? "max-h-[110px] max-w-full object-contain"
        : "h-[140px] w-[140px] object-contain";
  const codeWrapClass =
    template.codeType === "barcode"
      ? "flex flex-col min-h-[142px] items-center justify-center py-1"
      : "flex flex-col min-h-[122px] items-center justify-center py-1";


  return (
    <div
      id="label-preview"
      className="mx-auto w-[680px] bg-white px-8 py-8 text-black shadow-sm"
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        minHeight: 620,
      }}
    >
      <h1 className="mb-8 text-[30px] font-normal leading-tight">Your Return Label</h1>

      <section className="mb-4">
        <h2 className="mb-3 text-[20px] font-bold leading-tight">
          Additional Instructions for mailing your package
        </h2>
        <ul className="ml-12 list-disc space-y-1 text-[16px] leading-[1.22]">
          {template.instructions.map((instruction, index) => (
            <li key={instruction}>
              <span>{instruction}</span>
              {index === (template.dropoffLinkInstructionIndex ?? 0) && template.dropoffLink ? (
                <>
                  <br />
                  <a className="text-[#1c68c9]" href={template.dropoffLink}>
                    {template.dropoffLink}
                  </a>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-4">
        <h2 className="mb-2 text-[20px] font-bold leading-tight">{template.codeLabel}</h2>
        <p className="mb-2 max-w-[820px] text-[16px] leading-[1.2]">{template.validityCopy}</p>
        <div className={codeWrapClass}>
          {codeImage ? (
            template.codeType === "barcode" ? (
              <div className="flex min-h-[128px] w-[470px] max-w-full items-center justify-center border-2 border-dashed border-neutral-400 bg-white px-8 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={imageClass} src={codeImage} alt={template.codeLabel} />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={imageClass} src={codeImage} alt={template.codeLabel} />
            )
          ) : (
            <div className="grid h-28 w-28 place-items-center border border-dashed border-neutral-400 text-center text-xs text-neutral-500">
              Code image
            </div>
          )}
        </div>
      </section>

      {template.secondaryCodeLabel ? (
        <section className="mb-4">
          <h2 className="mb-2 text-[16px] leading-tight">
            <span className="font-bold">{template.secondaryCodeLabel}:</span>{" "}
            <span>{template.secondaryCodeHelp}</span>
          </h2>
          <div className="flex min-h-[86px] items-center justify-center py-1">
            {secondaryImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="max-h-[120px] max-w-[420px] object-contain"
                src={secondaryImage}
                alt={template.secondaryCodeLabel}
              />
            ) : (
              <div className="grid h-20 w-64 place-items-center border border-dashed border-neutral-400 text-center text-xs text-neutral-500">
                Authorisation label
              </div>
            )}
          </div>
        </section>
      ) : null}

      {template.showItemTable ? (
        <table className="mt-1 w-full border-collapse border border-neutral-300 text-[16px]">
          <thead>
            <tr className="bg-[#f0f1f1]">
              <th className="border-b border-neutral-300 px-4 py-4 text-left font-bold">
                Item Descriptions
              </th>
              <th className="w-32 border-b border-neutral-300 px-4 py-4 text-right font-bold">
                Quantity
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-4 leading-[1.25]">{itemName || "Item description"}</td>
              <td className="px-4 py-4 text-right align-top">{quantity}</td>
            </tr>
          </tbody>
        </table>
      ) : null}

      <div className="mt-5 border-t border-neutral-200 pt-3 text-[12px] leading-relaxed text-neutral-500">
        <span>{template.dropoffNote}</span>
        {orderRef ? <span className="ml-4">Ref: {orderRef}</span> : null}
      </div>
    </div>
  );
}
