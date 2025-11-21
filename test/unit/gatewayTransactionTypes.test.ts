import { describe, it, expect } from "vitest";
import type { GatewayTransaction } from "../../src/domain/gateway";

describe("GatewayTransaction types", () => {
  it("allows DISPERSION", () => {
    const tx: GatewayTransaction = {
      status: { status: "APPROVED" },
      type: "DISPERSION",
      provider: "CREDIBANCO"
    };
    expect(tx.type).toBe("DISPERSION");
  });
});
