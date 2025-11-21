import { describe, it, expect } from "vitest";
import GatewayService from "../../src/services/gatewayService";
import type { Carrier } from "../../src/contracts/carrier";
import { SystemTimeProvider } from "../../src/core/auth";

const basePayment = {
  reference: "ORDER",
  amount: { currency: "USD", total: 100 }
};

const baseInstrument = { token: { token: "tok_123" } };

const basePayer = {
  document: "123",
  documentType: "CC",
  name: "John",
  surname: "Doe",
  email: "john@example.com"
};

describe("GatewayService", () => {
  it("valida campos obligatorios en collect", async () => {
    const carrier: Carrier = {
      post: async <T>(_path: string, _body: unknown): Promise<T> => {
        throw new Error("no deberia llamarse");
      }
    };

    const service = new GatewayService(
      carrier,
      "login",
      "secret",
      new SystemTimeProvider()
    );

    await expect(
      service.collect({
        payment: basePayment,
        instrument: baseInstrument,
        payer: basePayer,
        ipAddress: "127.0.0.1",
        userAgent: "Vitest"
      } as any)
    ).rejects.toMatchObject({ name: "PlacetoPayValidationError" });
  });

  it("ejecuta collect y retorna respuesta", async () => {
    const carrier: Carrier = {
      post: async <T>(_path: string, _body: unknown): Promise<T> =>
        ({
          status: {
            status: "APPROVED",
            reason: "00",
            message: "ok",
            date: new Date().toISOString()
          },
          requestId: 999
        } as unknown as T)
    };

    const service = new GatewayService(
      carrier,
      "login",
      "secret",
      new SystemTimeProvider()
    );

    const res = await service.collect({
      payment: basePayment,
      instrument: baseInstrument,
      payer: basePayer,
      ipAddress: "127.0.0.1",
      userAgent: "Vitest",
      returnUrl: "https://example.com/return"
    });

    expect((res as any).requestId).toBe(999);
  });
});
