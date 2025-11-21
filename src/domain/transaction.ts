import type { Amount } from "./amount";
import type { Status } from "./status";

export interface Transaction {
  internalReference?: number;
  reference?: string;

  paymentMethod?: string;
  paymentMethodName?: string;
  issuerName?: string;

  amount?: Amount;

  authorization?: string;
  receipt?: string;

  franchise?: string;
  refunded?: boolean;

  status?: Status;

  [key: string]: unknown;
}

export type TransactionActionType =
  | "checkout"
  | "reauthorization"
  | "reverse";

export interface TransactionActionRequest {
  action: TransactionActionType;
  internalReference: number;
  amount?: Amount;
  fields?: import("./payment").NameValuePair[];
}
