import type { Amount } from "./amount";
import type { Status } from "./status";
import type { NameValuePair } from "./payment";

export interface Transaction {
  status?: Status;
  internalReference?: number;
  reference?: string;
  paymentMethod?: string;
  paymentMethodName?: string;
  issuerName?: string;
  amount?: {
    from?: Amount;
    to?: Amount;
    factor?: number;
  };
  authorization?: string;
  receipt?: string;
  franchise?: string;
  refunded?: boolean;
  processorFields?: NameValuePair[];

  [key: string]: unknown;
}

export type TransactionActionType = "checkout" | "reauthorization" | "reverse";

export interface TransactionActionRequest {
  internalReference: number;
  action: TransactionActionType;
  amount?: Amount;
  description?: string;
  allowPartial?: boolean;
  subscribe?: boolean;
  fields?: NameValuePair[];
}
