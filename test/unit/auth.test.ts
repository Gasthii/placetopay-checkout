import { describe, it, expect, vi, afterEach } from "vitest";
import { buildAuth } from "../../src/core/auth";

class FixedTimeProvider {
  now(): Date {
    return new Date("2025-01-02T03:04:05.000Z");
  }
}

describe("buildAuth", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("genera tranKey determinista con seed y nonce conocidos", () => {
    const nonce = Buffer.from("0123456789abcdef");

    const auth = buildAuth(
      "login",
      "secret",
      new FixedTimeProvider(),
      () => nonce
    );

    expect(auth).toMatchObject({
      login: "login",
      seed: "2025-01-02T03:04:05.000Z",
      nonce: nonce.toString("base64"),
      tranKey: "i5IuHVWzU298tWmRWupLtliMtVsSXi4iE1W1VyO9B68="
    });
  });
});
