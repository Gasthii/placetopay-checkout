export interface GatewayTokenizeResponse {
  status: { status: string; reason?: string | number | null; message?: string | null; date?: string };
  data?: Record<string, unknown>;
}

export interface GatewaySearchResponse {
  status: { status: string; reason?: string | number | null; message?: string | null; date?: string };
  transactions?: import("./gateway").GatewayTransaction[];
  requestId?: number;
}

export interface GatewayOtpResponse {
  status: { status: string; reason?: string | number | null; message?: string | null; date?: string };
  internalReference?: number;
  requestId?: number;
}

export interface GatewayThreeDSResponse {
  status: { status: string; reason?: string | number | null; message?: string | null; date?: string };
  internalReference?: number;
  requestId?: number;
}

export interface GatewayReportResponse {
  status: { status: string; reason?: string | number | null; message?: string | null; date?: string };
  transactions?: import("./gateway").GatewayTransaction[];
}

export interface GatewayAccountValidatorResponse {
  status: { status: string; reason?: string | number | null; message?: string | null; date?: string };
  provider?: string;
  serviceCode?: string;
  cardType?: string;
  cardTypes?: string[];
  threeDS?: string;
  bankList?: Array<{ code?: string; name?: string; [key: string]: unknown }>;
}

export interface GatewayCashOrderResponse {
  status: { status: string; reason?: string | number | null; message?: string | null; date?: string };
  requestId?: number;
  processUrl?: string;
}

export interface GatewayPinpadResponse {
  status: { status: string; reason?: string | number | null; message?: string | null; date?: string };
}

export interface GatewayInformationResponse {
  status: { status: string; reason?: string | number | null; message?: string | null; date?: string };
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
    installments?: Array<number>;
  }>;
  requirePockets?: boolean;
  pockets?: Array<Record<string, unknown>>;
  requireAvs?: boolean;
  zipCodeFormat?: string | null;
  accountVerification?: boolean;
  requirePin?: boolean;
  requireRedirection?: boolean;
  bankList?: Array<{ code?: string; name?: string; [key: string]: unknown }>;
}

export interface GatewayTokenLookupResponse {
  status: { status: string; reason?: string | number | null; message?: string | null; date?: string };
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
