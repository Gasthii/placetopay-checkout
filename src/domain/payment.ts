import type { Amount } from "./amount";
import type { Person } from "./person";

export interface Item {
  sku?: string;
  name?: string;
  category?: string;
  qty?: number | string;
  price?: number;
  tax?: number;
  amount?: Amount;
  [key: string]: unknown;
}

export interface DispersionDetail {
  agreement: string;
  agreementType?: string;
  amount: Amount;
  [key: string]: unknown;
}

export interface Modifier {
  type: string;
  code?: string | number;
  additional?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface Payment {
  reference: string;
  description?: string;
  amount: Amount;

  allowPartial?: boolean;
  items?: Item[];

  shipping?: Person;
  discount?: Amount;
  porcentualDiscount?: boolean;

  recurring?: {
    periodicity?: string;
    interval?: string | number;
    nextPayment?: string;
    maxPeriods?: number;
    dueDate?: string;
    notificationUrl?: string;
    [key: string]: unknown;
  };

  subscribe?: boolean;
  dispersion?: DispersionDetail[];
  modifiers?: Modifier[];
  processorFields?: NameValuePair[];
  fields?: NameValuePair[];

  [key: string]: unknown;
}

export interface NameValuePair {
  keyword: string;
  value: string | number | boolean | Record<string, unknown> | Array<unknown>;
  displayOn?: "payment" | "invoice" | "none" | string;
}
