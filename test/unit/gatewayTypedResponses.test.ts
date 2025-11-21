import { describe, it, expect } from "vitest";
import GatewayService from "../../src/services/gatewayService";
import type { Carrier } from "../../src/contracts/carrier";
import { SystemTimeProvider } from "../../src/core/auth";

const carrier = {
  post: async <T>(_path: string, _body: unknown): Promise<T> =>
    ({ status: { status: "OK", reason: "00", message: "ok", date: new Date().toISOString() } } as unknown as T)
} as Carrier;

function makeSvc() {
  return new GatewayService(carrier, "login", "secret", new SystemTimeProvider());
}

describe("GatewayService typed responses", () => {
  it("tokenize returns typed status", async () => {
    const svc = makeSvc();
    const res = await svc.tokenize({
      instrument: { card: { number: "4111", expiration: "12/30", cvv: "123" } }
    } as any);
    expect((res as any).status.status).toBe("OK");
  });

  it("otp returns typed status", async () => {
    const svc = makeSvc();
    const res = await svc.otp({ internalReference: 1, otp: "123456" } as any);
    expect((res as any).status.status).toBe("OK");
  });

  it("threeDS returns typed status", async () => {
    const svc = makeSvc();
    const res = await svc.threeDS({ internalReference: 1 } as any);
    expect((res as any).status.status).toBe("OK");
  });
});
