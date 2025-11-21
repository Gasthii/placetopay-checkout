import { describe, it, expect } from "vitest";
import type { GatewayTransaction } from "../../src/domain/gateway";

describe("GatewayTransaction dispersion", () => {
  it("allows dispersion items with airline and merchant", () => {
    const tx: GatewayTransaction = {
      status: { status: "APPROVED" },
      type: "DISPERSION",
      dispersion: [
        {
          type: "AIRLINE",
          authorization: "739877",
          receipt: "713329175945",
          amount: {
            currency: "USD",
            total: 1055.5,
            taxes: [
              { kind: "airportTax", amount: 163 },
              { kind: "valueAddedTax", amount: 142.5 }
            ]
          }
        },
        {
          type: "MERCHANT",
          authorization: "000000",
          receipt: null,
          amount: { currency: "USD", total: 105.62, taxes: [{ kind: "valueAddedTax", amount: 15.97 }] }
        }
      ]
    };
    expect(tx.dispersion?.length).toBe(2);
    expect(tx.dispersion?.[0]?.type).toBe("AIRLINE");
  });
});
