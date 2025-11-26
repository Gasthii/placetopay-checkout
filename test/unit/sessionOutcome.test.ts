import { describe, it, expect } from "vitest";
import { summarizeSessionOutcome } from "../../src/core/sessionOutcome";

const baseInfo = {
  requestId: 1,
  status: { status: "APPROVED", reason: "00", message: "ok", date: "2025-01-01T00:00:00Z" },
  request: {
    payment: {
      amount: { currency: "USD", total: 100 },
      reference: "TEST-1"
    }
  }
} as any;

describe("summarizeSessionOutcome", () => {
  it("marks paid when status APPROVED and sums paidTotal", () => {
    const info = {
      ...baseInfo,
      payment: [
        {
          status: { status: "APPROVED", reason: "00", message: "ok" },
          internalReference: 99,
          reference: "TEST-1",
          paymentMethod: "visa",
          amount: { to: { currency: "USD", total: 100 } }
        }
      ]
    };

    const outcome = summarizeSessionOutcome(info);
    expect(outcome.paid).toBe(true);
    expect(outcome.partiallyPaid).toBe(false);
    expect(outcome.paidTotal).toBe(100);
    expect(outcome.pendingTotal).toBe(0);
    expect(outcome.final).toBe(true);
  });

  it("detects partial paid when status APPROVED_PARTIAL", () => {
    const info = {
      ...baseInfo,
      status: { status: "APPROVED_PARTIAL" },
      payment: [
        {
          status: { status: "APPROVED", reason: "00" },
          amount: { to: { currency: "USD", total: 40 } }
        }
      ]
    };
    const outcome = summarizeSessionOutcome(info);
    expect(outcome.paid).toBe(false);
    expect(outcome.partiallyPaid).toBe(true);
    expect(outcome.paidTotal).toBe(40);
    expect(outcome.pendingTotal).toBe(60);
  });

  it("handles PARTIAL_EXPIRED as final and expiredPartial=true", () => {
    const info = {
      ...baseInfo,
      status: { status: "PARTIAL_EXPIRED" },
      payment: []
    };
    const outcome = summarizeSessionOutcome(info);
    expect(outcome.final).toBe(true);
    expect(outcome.expiredPartial).toBe(true);
  });

  it("sums requested when multiple payments array provided in request", () => {
    const info = {
      ...baseInfo,
      request: {
        payments: [
          { amount: { currency: "USD", total: 30 } },
          { amount: { currency: "USD", total: 70 } }
        ]
      },
      payment: []
    };
    const outcome = summarizeSessionOutcome(info);
    expect(outcome.totalRequested).toBe(100);
  });
});
