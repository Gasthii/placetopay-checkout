import type { Payment } from "./payment";
import type { Person } from "./person";
import type { Instrument } from "./instrument";

export interface GatewayProcessRequest {
  payment: Payment;
  instrument: Instrument;
  payer: Person;
  buyer?: Person;
  ipAddress: string;
  userAgent: string;
  locale?: string;
  provider?: string;
  additional?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  initiatorIndicator?: string;
  orchestrator?: Record<string, unknown>;
  idempotencyKey?: string;
  capture?: boolean;
  [key: string]: unknown;
}

export interface GatewayStatus {
  status: string;
  reason?: string | number | null;
  message?: string | null;
  date?: string;
}

export interface GatewayAmountConversion {
  from?: { currency?: string; total?: number | string };
  to?: { currency?: string; total?: number | string };
  factor?: number | string;
}

export interface GatewayProcessorFields {
  id?: string;
  b24?: string;
  bin?: string;
  expiration?: string;
  installments?: number;
  merchantCode?: string;
  terminalNumber?: string;
  totalAmount?: number;
  interestAmount?: number;
  installmentAmount?: number;
  iceAmount?: number;
  lastDigits?: string;
  credit?: {
    code?: string;
    type?: string;
    groupCode?: string;
    installments?: number;
  };
  [key: string]: unknown;
}

export type GatewayTransactionType =
  | "CREDIT"
  | "RE_AUTH"
  | "CHECKOUT"
  | "REFUND"
  | "SETTLE"
  | "VOID"
  | "DISPERSION"
  | "AIRLINE"
  | "MERCHANT"
  | "AUTH_ONLY"
  | string;

export interface GatewayTransaction {
  status: GatewayStatus;
  date?: string;
  transactionDate?: string;
  internalReference?: number;
  requestId?: number;
  reference?: string;
  paymentMethod?: string;
  franchise?: string;
  franchiseName?: string;
  issuerName?: string;
  amount?: Payment["amount"];
  conversion?: GatewayAmountConversion;
  authorization?: string | null;
  receipt?: string | null;
  type?: GatewayTransactionType;
  refunded?: boolean;
  lastDigits?: string;
  provider?: string;
  discount?: unknown;
  processorFields?: GatewayProcessorFields;
  additional?: Record<string, unknown>;
  dispersion?: Array<{
    type?: "AIRLINE" | "MERCHANT" | string;
    authorization?: string | null;
    receipt?: string | null;
    amount?: Payment["amount"];
    reference?: string;
    internalReference?: number;
    status?: GatewayStatus;
  }>;
  preAuthorization?: {
    condition?: string;
    internalReference?: number;
    authorization?: string;
    receipt?: string;
    amount?: Payment["amount"];
    salt?: string;
  };
}

export interface GatewayProcessResponse {
  status: GatewayStatus;
  date?: string;
  transactionDate?: string;
  requestId?: number;
  processUrl?: string;
  internalReference?: number;
  reference?: string;
  paymentMethod?: string;
  franchise?: string;
  franchiseName?: string;
  issuerName?: string;
  amount?: Payment["amount"];
  conversion?: GatewayAmountConversion;
  authorization?: string | null;
  receipt?: string | null;
  type?: GatewayTransactionType;
  refunded?: boolean;
  lastDigits?: string;
  provider?: string;
  discount?: unknown;
  processorFields?: Record<string, unknown>;
  additional?: Record<string, unknown>;
}

export interface GatewayQueryResponse {
  status: GatewayStatus;
  transactions?: GatewayTransaction[];
}

export interface GatewayTransactionResponse extends GatewayTransaction {}

export interface GatewayQueryRequest {
  requestId?: number | string;
  internalReference?: number | string;
  reference?: string;
  notify?: boolean;
  data?: boolean;
  provider?: string;
  [key: string]: unknown;
}

export interface GatewaySearchRequest {
  filters?: Record<string, unknown>;
  pagination?: { page?: number; limit?: number };
  provider?: string;
  [key: string]: unknown;
}

export interface GatewayTransactionRequest {
  action: string;
  internalReference: number | string;
  amount?: Payment["amount"];
  fields?: Payment["fields"];
  provider?: string;
  idempotencyKey?: string;
  [key: string]: unknown;
}

export interface GatewayTokenizeRequest {
  instrument: Instrument;
  payer?: Person;
  provider?: string;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
  [key: string]: unknown;
}

export interface GatewayOtpRequest {
  internalReference: number | string;
  otp: string;
  provider?: string;
  idempotencyKey?: string;
  [key: string]: unknown;
}

export interface Gateway3dsRequest {
  internalReference: number | string;
  pares?: string;
  cRes?: string;
  provider?: string;
  idempotencyKey?: string;
  [key: string]: unknown;
}

export interface GatewayReportRequest {
  internalReference?: number | string;
  requestId?: number | string;
  reference?: string;
  provider?: string;
  idempotencyKey?: string;
  [key: string]: unknown;
}

export interface GatewayBasicResponse {
  status: GatewayStatus;
  requestId?: number;
  internalReference?: number;
  processUrl?: string;
  transactionDate?: string;
  provider?: string;
  serviceCode?: string;
  data?: Record<string, unknown>;
}

export interface GatewayPinpadRequest {
  provider?: string;
  [key: string]: unknown;
}

export interface GatewayAccountValidatorRequest {
  instrument: Instrument;
  payment?: Payment;
  ipAddress: string;
  userAgent: string;
  provider?: string;
  [key: string]: unknown;
}

export interface GatewayCashOrderRequest {
  payment: Payment;
  payer: Person;
  buyer?: Person;
  provider?: string;
  [key: string]: unknown;
}
