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
});
