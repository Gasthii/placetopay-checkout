import type { RedirectInformation } from "../domain/redirect";
import type { SessionStatusCode } from "../domain/status";

type Numeric = number | string | undefined | null;

export interface PaymentAttemptSummary {
  internalReference?: number;
  reference?: string;
  status?: string;
  reason?: string | number | null;
  message?: string | null;
  authorization?: string | null;
  receipt?: string | null;
  paymentMethod?: string | null;
  amount?: number;
  currency?: string;
}

export interface SessionOutcome {
  requestId?: number;
  status: SessionStatusCode | string;
  final: boolean;
  paid: boolean;
  partiallyPaid: boolean;
  expiredPartial: boolean;
  totalRequested?: number;
  currency?: string;
  paidTotal: number;
  pendingTotal: number;
  attempts: PaymentAttemptSummary[];
}

const FINAL_STATUSES: SessionStatusCode[] = [
  "APPROVED",
  "REJECTED",
  "APPROVED_PARTIAL",
  "PARTIAL_EXPIRED",
  "FAILED"
];

function toNumber(value: Numeric): number {
  if (value === undefined || value === null) return 0;
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

function extractPaymentAmount(payment: any): { amount?: number; currency?: string } {
  const to = payment?.amount?.to;
  const from = payment?.amount?.from;
  const simple = payment?.amount;
  if (to && to.total !== undefined) return { amount: toNumber(to.total), currency: to.currency };
  if (from && from.total !== undefined) {
    return { amount: toNumber(from.total), currency: from.currency };
  }
  if (simple && simple.total !== undefined) {
    return { amount: toNumber(simple.total), currency: simple.currency };
  }
  return {};
}

function collectRequested(info: RedirectInformation): { total?: number; currency?: string } {
  if (info.request?.payment?.amount?.total !== undefined) {
    return {
      total: toNumber(info.request.payment.amount.total),
      currency: info.request.payment.amount.currency
    };
  }
  if (Array.isArray(info.request?.payments)) {
    const totals = info.request.payments.map((p: any) => toNumber(p?.amount?.total ?? 0));
    const sum = totals.reduce((acc, v) => acc + v, 0);
    const currency = info.request.payments[0]?.amount?.currency;
    return { total: sum, currency };
  }
  return {};
}

export function summarizeSessionOutcome(info: RedirectInformation): SessionOutcome {
  const status = info.status?.status as SessionStatusCode | string;
  const { total: totalRequested, currency } = collectRequested(info);

  const attempts: PaymentAttemptSummary[] = Array.isArray(info.payment)
    ? info.payment.map((p: any) => {
        const { amount, currency: pCurrency } = extractPaymentAmount(p);
        return {
          internalReference: p.internalReference,
          reference: p.reference,
          status: p.status?.status,
          reason: p.status?.reason,
          message: p.status?.message,
          authorization: p.authorization,
          receipt: p.receipt,
          paymentMethod: p.paymentMethod,
          amount,
          currency: pCurrency ?? currency
        };
      })
    : [];

  const paidTotal = attempts
    .filter((a) => a.status === "APPROVED" || a.status === "APPROVED_PARTIAL")
    .reduce((acc, a) => acc + toNumber(a.amount), 0);

  const pendingTotal =
    totalRequested !== undefined ? Math.max(totalRequested - paidTotal, 0) : 0;

  const final = FINAL_STATUSES.includes(status as SessionStatusCode);
  const paid = status === "APPROVED";
  const partiallyPaid = status === "APPROVED_PARTIAL" || (paidTotal > 0 && !paid);
  const expiredPartial = status === "PARTIAL_EXPIRED";

  return {
    requestId: info.requestId,
    status,
    final,
    paid,
    partiallyPaid,
    expiredPartial,
    totalRequested,
    currency,
    paidTotal,
    pendingTotal,
    attempts
  };
}
