import { describe, it, expect } from "vitest";
import PaymentLinkService from "../../src/services/paymentLinkService";
import AutopayService from "../../src/services/autopayService";
import type { Carrier } from "../../src/contracts/carrier";
import { SystemTimeProvider } from "../../src/core/auth";

const carrier: Carrier = {
  post: async <T>(_path: string, _body: unknown): Promise<T> =>
    ({ status: { status: "OK", reason: "00", message: "ok", date: new Date().toISOString() }, id: 1, url: "http://test" } as unknown as T)
};

describe("PaymentLinkService", () => {
  it("create returns id and url", async () => {
    const svc = new PaymentLinkService(carrier, "l", "s", new SystemTimeProvider());
    const res = await svc.create({ amount: { currency: "USD", total: 10 } });
    expect(res.id).toBe(1);
    expect(res.url).toBe("http://test");
  });
});

describe("AutopayService", () => {
  it("create returns status", async () => {
    const svc = new AutopayService(carrier, "l", "s", new SystemTimeProvider());
    const res = await svc.create({ subscription: { reference: "R" } as any });
    expect(res.status.status).toBe("OK");
  });
});
