import type { Status } from "./status";

export interface CheckoutNotification {
  status: Status;
  requestId: number | string;
  reference: string;
  signature: string;
  [key: string]: unknown;
}
