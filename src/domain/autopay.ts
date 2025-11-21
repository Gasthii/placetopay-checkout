import type { Status } from "./status";

export interface AutopayRecurring {
  type?: "TOTAL_BALANCE" | "MINIMUM_BALANCE";
  periodicity?: string;
  interval?: number;
  maxPeriods?: number;
  nextPayment?: string;
  startDate?: string;
  dueDate?: string;
}

export interface AutopaySubscription {
  reference: string;
  description?: string;
  recurring?: AutopayRecurring;
  amount?: import("./amount").Amount;
}

export interface AutopayCreateRequest {
  subscription: AutopaySubscription;
  dueDay?: string;
  additional?: Record<string, unknown>;
  expiration?: string;
  returnUrl?: string;
  locale?: string;
}

export interface AutopayCreateResponse {
  status: Status;
  id?: string;
  processUrl?: string;
  requestId?: number;
}

export interface AutopayUpdateRequest {
  subscription: AutopaySubscription;
  dueDay?: string;
  additional?: Record<string, unknown>;
  expiration?: string;
  returnUrl?: string;
  locale?: string;
}

export interface AutopayBasicResponse {
  status: Status;
  [key: string]: unknown;
}
