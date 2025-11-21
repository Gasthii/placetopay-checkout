import { describe, it, expect } from "vitest";
import SessionService from "../../src/services/sessionService";
import type { Carrier } from "../../src/contracts/carrier";
import { SystemTimeProvider } from "../../src/core/auth";

const basePayment = {
  reference: "ORDER",
  amount: { currency: "UYU", total: 100 }
};

describe("SessionService", () => {
  it("valida campos minimos", async () => {
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
        payment: basePayment,
        ipAddress: "127.0.0.1",
        userAgent: "Vitest"
      } as any)
    ).rejects.toMatchObject({ name: "PlacetoPayValidationError" });
  });

  it("rechaza expiration menor a 5 minutos", async () => {
    const carrier: Carrier = {
      post: async <T>(_path: string, _body: unknown): Promise<T> => {
        throw new Error("no deberia llamarse");
      }
    };

    const now = new Date("2024-01-01T00:00:00Z");
    const service = new SessionService(
      carrier,
      "login",
      "secret",
      { now: () => now }
    );

    const expiration = new Date(now.getTime() + 2 * 60_000).toISOString();

    await expect(
      service.create({
        payment: basePayment,
        ipAddress: "127.0.0.1",
        userAgent: "Vitest",
        returnUrl: "https://example.com/return",
        expiration
      } as any)
    ).rejects.toMatchObject({ name: "PlacetoPayValidationError" });
  });

  it("rechaza locale invalido", async () => {
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
        payment: basePayment,
        ipAddress: "127.0.0.1",
        userAgent: "Vitest",
        returnUrl: "https://example.com/return",
        locale: "es-co"
      } as any)
    ).rejects.toMatchObject({ name: "PlacetoPayValidationError" });
  });

  it("crea sesion si status OK", async () => {
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
