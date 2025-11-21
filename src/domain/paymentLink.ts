import type { Amount } from "./amount";
import type { Status } from "./status";

export interface PaymentLinkCreateRequest {
  auth: any;
  name?: string;
  reference?: string;
  description?: string;
  amount?: Amount;
  expirationDate?: string;
  paymentExpiration?: number;
  sendEmail?: boolean;
  emails?: string[];
  [key: string]: unknown;
}

export interface PaymentLinkCreateResponse {
  status: Status;
  id?: number;
  url?: string;
}

export interface PaymentLinkInfo {
  id: number;
  status: string;
  url?: string;
  expirationDate?: string;
  name?: string;
  reference?: string;
  description?: string;
  totalPayments?: number;
  availablePayments?: number;
  paymentExpiration?: number;
  amount?: Amount;
  site?: {
    id?: number;
    slug?: string;
    companyName?: string;
    storeName?: string;
    address?: string | null;
    phone?: string | null;
    document?: string;
    documentType?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
  paymentMethods?: string[];
  [key: string]: unknown;
}

export interface PaymentLinkGetResponse extends PaymentLinkInfo {
  status: string;
}

export interface PaymentLinkDisableResponse {
  status: Status;
  id?: number;
}
