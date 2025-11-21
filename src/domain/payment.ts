import type { Amount } from "./amount";

export interface Item {
  sku?: string;
  name?: string;
  category?: string;
  qty?: number;
  price?: number;
  [key: string]: unknown;
}

export interface Payment {
  reference: string;
  description?: string;
  amount: Amount;

  allowPartial?: boolean;
  items?: Item[];

  shipping?: Amount;
  discount?: Amount;
  porcentualDiscount?: boolean;

  recurring?: {
    interval: string;
    nextPayment: string;
    maxPeriods?: number;
    [key: string]: unknown;
  };

  subscribe?: boolean;

  [key: string]: unknown;
}

export interface NameValuePair {
  keyword: string;
  value: string;
  displayOn?: "payment" | "invoice" | "none" | string;
}
