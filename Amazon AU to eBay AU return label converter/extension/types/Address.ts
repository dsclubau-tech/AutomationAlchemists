export type AuState = "NSW" | "VIC" | "QLD" | "WA" | "SA" | "TAS" | "ACT" | "NT";

export interface Address {
  orderId: string;
  buyerName: string;
  street1: string;
  street2?: string;
  suburb: string;
  state: AuState | "";
  postcode: string;
  country: string;
  phone?: string;
  email?: string;
  itemTitle: string;
  qty: number;
  rawText: string;
  sourceUrl: string;
  ebayOrderId?: string;
  amazonAsin?: string;
  isPOBox: boolean;
  isParcelCollect: boolean;
  parcelCollectId?: string;
  validationWarnings: string[];
}

export interface CpBotSettings {
  autoUseThisAddress: boolean;
  automationDisabled: boolean;
  giftOptions: {
    enabled: boolean;
    message: string;
    from: string;
  };
  webAppUrl: string;
}
