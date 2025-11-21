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
  fields?: NameValuePair[];
  [key: string]: unknown;
}

export interface SessionMetadata {
  returnPath?: string;
  returnParams?: Record<string, unknown>;
  cancelPath?: string;
  cancelParams?: Record<string, unknown>;
  initiatorIndicator?:
    | "AGENT"
    | "CARDHOLDER_COF"
    | "CARDHOLDER_RECURRING_VARIABLE_AMOUNT"
    | "CARDHOLDER_RECURRING_FIXED_AMOUNT"
    | "CARDHOLDER_WITH_INSTALLMENTS"
    | "MERCHANT_COF"
    | "MERCHANT_RECURRING_VARIABLE_AMOUNT"
    | "MERCHANT_RECURRING_FIXED_AMOUNT"
    | "MERCHANT_WITH_INSTALLMENTS"
    | string;
  EBTDeliveryIndicator?:
    | "DIRECT_DELIVERY"
    | "CUSTOMER_PICKUP"
    | "COMMERCIAL_SHIPPING"
    | "OTHER"
    | "NOT_AVAILABLE"
    | string;
  openingDate?: string;
  beneficiaryId?: string;
  [key: string]: unknown;
}

export interface RedirectRequest {
  locale?: string;

  payment?: Payment;
  payments?: Payment[];

  subscription?: SubscriptionRequest;

  buyer?: Person;
  payer?: Person;

  attemptsLimit?: number;

  ipAddress: string;
  userAgent: string;

  returnUrl: string;
  cancelUrl?: string;

  expiration?: string;
  paymentMethod?: string;
  paymentMethods?: string[];

  fields?: NameValuePair[];
  skipResult?: boolean;
  noBuyerFill?: boolean;

  type?: "checkin" | string;

  metadata?: SessionMetadata;
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
