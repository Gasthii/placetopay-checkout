import { describe, it, expect } from "vitest";
import type { GatewayTransaction } from "../../src/domain/gateway";

describe("Gateway processorFields typing", () => {
  it("allows documented processor fields", () => {
    const tx: GatewayTransaction = {
      status: { status: "APPROVED" },
      processorFields: {
        id: "abc",
        b24: "000",
        bin: "411111",
        expiration: "0525",
        installments: 1,
        merchantCode: "012988341",
        terminalNumber: "00022645",
        totalAmount: 52,
        interestAmount: 0,
        installmentAmount: 0,
        iceAmount: 0,
        lastDigits: "1111",
        credit: {
          code: "1",
          type: "00",
          groupCode: "C",
          installments: 1
        }
      }
    };
    expect(tx.processorFields?.b24).toBe("000");
  });
});
