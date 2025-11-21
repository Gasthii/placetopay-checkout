import { describe, it, expect } from "vitest";
import { buildAuth } from "../../src/core/auth";

describe("buildAuth", () => {
  it("genera auth con campos requeridos", () => {
    const auth = buildAuth("login", "secret");
    expect(auth.login).toBe("login");
    expect(auth.seed).toBeTypeOf("string");
    expect(auth.nonce).toBeTypeOf("string");
    expect(auth.tranKey).toBeTypeOf("string");
  });

  it("genera nonce/tranKey distintos en cada call", () => {
    const a1 = buildAuth("login", "secret");
    const a2 = buildAuth("login", "secret");
    expect(a1.nonce).not.toBe(a2.nonce);
    expect(a1.tranKey).not.toBe(a2.tranKey);
  });
});
