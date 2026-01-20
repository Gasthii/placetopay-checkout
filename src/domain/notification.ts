import type { Status } from "./status";

export interface CheckoutNotification {
  status: Status;
  requestId: number | string;
  reference: string;
  signature: string;
  [key: string]: unknown;
}

export interface AchReturnNotification {
  time: string;
  type: string; // e.g. "chargeback.created"
  data: {
    status: Status;
    date: string;
    transactionDate: string;
    internalReference: number;
    reference: string;
    paymentMethod: string;
    franchise: string;
    franchiseName: string;
    issuerName: string | null;
    amount: {
      taxes: unknown[]; // Keeping generic as example showed generic structure
      currency: string;
      total: number;
    };
    conversion?: {
      from: { currency: string; total: number };
      to: { currency: string; total: number };
      factor: number;
    };
    authorization: string;
    receipt: string | null;
    refunded: boolean;
    lastDigits: string | null;
    provider: string | null;
    discount: unknown | null;
    processorFields?: Record<string, unknown>;
    additional?: Record<string, unknown>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
