export interface Status {
  status: string;
  reason: string;
  message: string;
  date: string;
}

export type SessionStatusCode =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "APPROVED_PARTIAL"
  | "PARTIAL_EXPIRED"
  | string;
