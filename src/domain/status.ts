export interface Status {
  status:
  | "OK"
  | "FAILED"
  | "APPROVED"
  | "APPROVED_PARTIAL"
  | "REJECTED"
  | "PENDING"
  | "PENDING_VALIDATION"
  | "REFUNDED"
  | string;
  reason: string;
  message: string;
  date: string;
}

export type SessionStatusCode = Status["status"];
