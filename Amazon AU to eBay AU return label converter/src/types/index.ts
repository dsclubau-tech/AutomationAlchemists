export type CodeType = "qr" | "barcode" | "label";

export type TemplateId =
  | "auspost_qr"
  | "auspost_label"
  | "parcelpoint_barcode"
  | "parcelpoint_label"
  | "parcelpoint_pickup";

export type ValidationStatus = "idle" | "passed" | "warning" | "unsupported";

export interface LabelTemplate {
  id: TemplateId;
  name: string;
  carrier: string;
  type: string;
  shortName: string;
  codeType: CodeType;
  codeLabel: string;
  instructions: string[];
  validityCopy: string;
  dropoffNote: string;
  dropoffLink?: string;
  dropoffLinkInstructionIndex?: number;
  showItemTable: boolean;
  secondaryCodeLabel?: string;
  secondaryCodeHelp?: string;
  secondaryCodeType?: CodeType;
  secondaryAspectRatio?: number;
  secondaryRequired?: boolean;
  accent: string;
  aspectRatio: number;
}

export interface LabelDetails {
  itemName: string;
  quantity: string;
  orderRef: string;
  trackingNumber?: string;
}

export interface CodeValidation {
  status: ValidationStatus;
  message: string;
  rawValue?: string;
  formats?: string[];
}
