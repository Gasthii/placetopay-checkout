import type { Amount } from "./amount";
import type { Person } from "./person";
import type { Payment, NameValuePair } from "./payment";
import type { Status } from "./status";
import type { Transaction, TransactionActionRequest } from "./transaction";
import type { CheckoutNotification } from "./notification";

export interface SubscriptionRequest {
  reference: string;
  description?: string;
  amount?: Amount;
  [key: string]: unknown;
}

export interface RedirectRequest {
  locale?: string;

  payment?: Payment;
  payments?: Payment[];

  subscription?: SubscriptionRequest;

  buyer?: Person;
  payer?: Person;

  ipAddress: string;
  userAgent: string;

  returnUrl: string;
  cancelUrl?: string;

  expiration?: string;
  paymentMethod?: string;

  fields?: NameValuePair[];
  skipResult?: boolean;
  noBuyerFill?: boolean;

  type?: "checkin" | string;

  metadata?: Record<string, unknown>;
}

export interface RedirectResponse {
  status: Status;
  requestId?: number;
  processUrl?: string;
  [key: string]: unknown;
}

export interface RedirectInformation {
  requestId: number;
  status: Status;
  request?: RedirectRequest;
  payment?: Transaction | Transaction[];
  subscription?: unknown;
  [key: string]: unknown;
}

export interface RefundRequest {
  internalReference: number;
  amount?: Amount;
  fields?: NameValuePair[];
}

export type {
  TransactionActionRequest,
  CheckoutNotification
};
