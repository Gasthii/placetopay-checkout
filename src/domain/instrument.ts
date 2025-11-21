import type { Payment, NameValuePair } from "./payment";
import type { Person } from "./person";
import type { RedirectInformation } from "./redirect";

export interface TokenInstrument {
  token: string;
  subtoken?: string;
}

export interface Instrument {
  token?: TokenInstrument;
  card?: Record<string, unknown>;
  account?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CollectRequest {
  locale?: string;
  payer: Person;
  buyer?: Person;
  payment: Payment;
  instrument: Instrument;
  ipAddress: string;
  userAgent: string;
  returnUrl?: string;
  expiration?: string;
  type?: string;
  metadata?: Record<string, unknown>;
  provider?: string;
  fields?: NameValuePair[];
}

export type CollectResponse = RedirectInformation;

export interface InstrumentInvalidateRequest {
  instrument: Instrument;
  locale?: string;
}

export interface GatewayInformationRequest {
  locale?: string;
  payment: Payment;
  instrument: Instrument;
  ipAddress: string;
  userAgent: string;
  provider?: string;
  metadata?: Record<string, unknown>;
}

export interface GatewayTokenRequest {
  locale?: string;
  instrument: Instrument;
}
