import { describe, it, expect } from "vitest";
import { validateDocument } from "../../src/core/documents";

describe("documents", () => {
  it("valida documento UYCI", () => {
    expect(() =>
      validateDocument({ country: "UY", documentType: "UYCI", document: "1234567-8" })
    ).not.toThrow();
  });

  it("falla en documento invalido", () => {
    expect(() =>
      validateDocument({ country: "UY", documentType: "UYCI", document: "abc" })
    ).toThrow();
  });
});
