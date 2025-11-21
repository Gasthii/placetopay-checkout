import { describe, it, expect } from "vitest";
import ReportService from "../../src/services/reportService";
import type { Carrier } from "../../src/contracts/carrier";
import { SystemTimeProvider } from "../../src/core/auth";

const carrier: Carrier = {
  post: async <T>(_p: string, _b: unknown): Promise<T> => ({ status: { status: "OK", reason: "00", message: "ok", date: new Date().toISOString() }, id: 1 } as unknown as T)
};

describe("ReportService", () => {
  it("requestReport returns id", async () => {
    const svc = new ReportService(carrier, "l", "s", new SystemTimeProvider());
    const res = await svc.requestReport({ filters: { startDate: "2023-01-01", endDate: "2023-01-02" } });
    expect((res as any).id).toBe(1);
  });
});
