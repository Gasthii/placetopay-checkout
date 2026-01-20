import type { Payment, NameValuePair } from "./payment";
import type { Person } from "./person";
import type { Instrument } from "./instrument";
import type { Status } from "./status";
import type { Amount } from "./amount";

// ============== REQUEST TYPES =================

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

export interface GatewayInformationRequest {
  locale?: string;
  payment: {
    reference: string;
    description: string;
    amount: Amount;
  };
  instrument: {
    card?: { number: string; expiration?: string; cvv?: string };
    token?: { token: string };
    [key: string]: unknown;
  };
  ipAddress?: string;
  userAgent?: string;
  provider?: string;
  metadata?: Record<string, unknown>;
}

export interface GatewayTokenRequest {
  instrument: {
    token: string;
    subtoken?: string;
    [key: string]: unknown;
  };
  locale?: string;
}

// ============== SHARED / INNER TYPES =================

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

// ============== RESPONSE TYPES =================

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

export interface GatewayTransactionResponse extends GatewayTransaction { }

export interface GatewayTokenizeResponse {
  status: GatewayStatus;
  data?: Record<string, unknown>;
}

export interface GatewaySearchResponse {
  status: GatewayStatus;
  transactions?: GatewayTransaction[];
  requestId?: number;
}

export interface GatewayOtpResponse {
  status: GatewayStatus;
  internalReference?: number;
  requestId?: number;
}

export interface GatewayThreeDSResponse {
  status: GatewayStatus;
  internalReference?: number;
  requestId?: number;
}

export interface GatewayReportResponse {
  status: GatewayStatus;
  transactions?: GatewayTransaction[];
}

export interface GatewayAccountValidatorResponse {
  status: GatewayStatus;
  provider?: string;
  serviceCode?: string;
  cardType?: string;
  cardTypes?: string[];
  threeDS?: string;
  bankList?: Array<{ code?: string; name?: string;[key: string]: unknown }>;
}

export interface GatewayCashOrderResponse {
  status: GatewayStatus;
  requestId?: number;
  processUrl?: string;
}

export interface GatewayPinpadResponse {
  status: GatewayStatus;
}

export interface GatewayInformationResponse {
  status: Status;
  provider?: string;
  serviceCode?: string;
  cardType?: string;
  cardTypes?: string[];
  displayInterest?: boolean;
  requireOtp?: boolean;
  requireCvv2?: boolean;
  threeDS?: "optional" | "required" | "unsupported" | string;
  credits?: Array<{
    description?: string;
    code?: string;
    groupCode?: string;
    type?: string;
    installments?: number[];
  }>;
  requirePockets?: boolean;
  pockets?: Array<Record<string, unknown>>;
  requireAvs?: boolean;
  zipCodeFormat?: string | null;
  accountVerification?: boolean;
  requirePin?: boolean;
  requireRedirection?: boolean;
  bankList?: Array<{ code?: string; name?: string;[key: string]: unknown }>;

  [key: string]: unknown;
}

export interface GatewayTokenLookupResponse {
  status: GatewayStatus;
  data?: {
    id?: number;
    type?: string;
    token?: string;
    subtoken?: string;
    franchise?: string;
    franchiseName?: string;
    issuerName?: string;
    lastDigits?: string;
    validUntil?: string;
    owner?: string;
  };
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
