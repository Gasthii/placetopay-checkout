import { describe, it, expect } from "vitest";
import PlacetoPayClient from "../../src/client";

describe("Integration: session flow", () => {
  it("create + query", async () => {
    let calledQuery = false;

    const fetchImpl = async (url: string) => {
      if (url.endsWith("/api/session")) {
        return new Response(
          JSON.stringify({
            status: {
              status: "OK",
              reason: "00",
              message: "created",
              date: new Date().toISOString()
            },
            requestId: 999,
            processUrl: "https://checkout.test/process/999"
          }),
          { status: 200 }
        );
      }

      if (url.includes("/api/session/999")) {
        calledQuery = true;
        return new Response(
          JSON.stringify({
            requestId: 999,
            status: {
              status: "APPROVED",
              reason: "00",
              message: "ok",
              date: new Date().toISOString()
            }
          }),
          { status: 200 }
        );
      }

      return new Response("not found", { status: 404 });
    };

    const client = new PlacetoPayClient({
      login: "login",
      secretKey: "secret",
      baseUrl: "https://checkout-test.placetopay.com",
      fetchImpl: fetchImpl as any
    });

    const created = await client.sessions.create({
      payment: {
        reference: "ORDER_999",
        amount: { currency: "UYU", total: 100 }
      },
      ipAddress: "127.0.0.1",
      userAgent: "Vitest",
      returnUrl: "https://example.com/return"
    });

    const info = await client.sessions.get(created.requestId!);
    expect(calledQuery).toBe(true);
    expect(info.status.status).toBe("APPROVED");
  });
});
