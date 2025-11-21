import { describe, it, expect } from "vitest";
import HttpClient from "../../src/core/httpClient";

describe("HttpClient", () => {
  it("parsea JSON OK", async () => {
    const fetchImpl = async () =>
      new Response(JSON.stringify({ ok: true }), { status: 200 });

    const http = new HttpClient({
      login: "x",
      secretKey: "y",
      baseUrl: "https://example.com",
      fetchImpl: fetchImpl as any
    });

    const res = await http.post<{ ok: boolean }>("/api/test", { a: 1 });
    expect(res.ok).toBe(true);
  });

  it("lanza PlacetoPayHttpError en no-2xx", async () => {
    const fetchImpl = async () =>
      new Response(JSON.stringify({ error: "boom" }), { status: 500 });

    const http = new HttpClient({
      login: "x",
      secretKey: "y",
      baseUrl: "https://example.com",
      fetchImpl: fetchImpl as any
    });

    await expect(http.post("/api/test", {})).rejects.toMatchObject({
      name: "PlacetoPayHttpError",
      httpStatus: 500
    });
  });

  it("mapea 401 auth 101 a mensaje claro", async () => {
    const fetchImpl = async () =>
      new Response(
        JSON.stringify({
          status: {
            status: "FAILED",
            reason: 101,
            message: "Autenticación fallida 101",
            date: "2025-01-01T00:00:00-05:00"
          }
        }),
        { status: 401 }
      );

    const http = new HttpClient({
      login: "x",
      secretKey: "y",
      baseUrl: "https://checkout-test.placetopay.com",
      fetchImpl: fetchImpl as any
    });

    await expect(http.post("/api/test", {})).rejects.toMatchObject({
      message: expect.stringContaining("codigo auth 101")
    });
  });
});
