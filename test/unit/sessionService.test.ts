import { describe, it, expect } from "vitest";
import SessionService from "../../src/services/sessionService";
import type { Carrier } from "../../src/contracts/carrier";
import { SystemTimeProvider } from "../../src/core/auth";

describe("SessionService", () => {
  it("valida campos mínimos", async () => {
    const carrier: Carrier = {
      post: async <T>(_path: string, _body: unknown): Promise<T> => {
        throw new Error("no deberia llamarse");
      }
    };

    const service = new SessionService(
      carrier,
      "login",
      "secret",
      new SystemTimeProvider()
    );

    await expect(
      service.create({
        payment: {
          reference: "ORDER",
          amount: { currency: "UYU", total: 100 }
        },
        ipAddress: "127.0.0.1",
        userAgent: "Vitest"
      } as any)
    ).rejects.toMatchObject({ name: "PlacetoPayValidationError" });
  });

  it("crea sesión si status OK", async () => {
    const carrier: Carrier = {
      post: async <T>(_path: string, _body: unknown): Promise<T> =>
        ({
          status: {
            status: "OK",
            reason: "00",
            message: "created",
            date: new Date().toISOString()
          },
          requestId: 123,
          processUrl: "https://checkout.test/process/123"
        } as unknown as T)
    };

    const service = new SessionService(
      carrier,
      "login",
      "secret",
      new SystemTimeProvider()
    );

    const res = await service.create({
      payment: {
        reference: "ORDER_1",
        amount: { currency: "UYU", total: 100 }
      },
      ipAddress: "127.0.0.1",
      userAgent: "Vitest",
      returnUrl: "https://example.com/return"
    });

    expect(res.requestId).toBe(123);
  });
});
