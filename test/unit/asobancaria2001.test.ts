import { describe, it, expect } from "vitest";
import { buildBillingFile, buildCollectionFile } from "../../src/invoice/asobancaria2001";

describe("Asobancaria2001 billing file", () => {
  it("builds a billing file with correct line lengths", () => {
    const txt = buildBillingFile({
      header: {
        nitEmpresaRecaudadora: "1234567890",
        fechaArchivo: "20250101",
        horaArchivo: "1530",
        modificador: "A"
      },
      batches: [
        {
          header: {
            codigoServicio: "1234567890123",
            numeroLote: 1,
            descripcionServicio: "SERVICIO"
          },
          details: [
            {
              referenciaPrincipal: "123456789012345678901234567890123456789012345678",
              valorPrincipal: 1500.25,
              fechaVencimiento: "20250131",
              fechaCorte: "20250205",
              incrementoDiario: 0.015,
              incrementoTipo: 0
            }
          ]
        }
      ]
    });
    const lines = txt.split("\n");
    expect(lines[0]).toHaveLength(220);
    expect(lines[1]).toHaveLength(220);
    expect(lines[2]).toHaveLength(220);
    expect(lines[3]).toHaveLength(220);
    expect(lines[4]).toHaveLength(220);
  });
});

describe("Asobancaria2001 collection file", () => {
  it("builds a collection file with correct line lengths", () => {
    const txt = buildCollectionFile({
      header: {
        nitEmpresaFacturadora: "1234567890",
        fechaRecaudo: "20250101",
        codigoEntidadRecaudadora: "123",
        numeroCuenta: "12345678901234567",
        fechaArchivo: "20250101",
        horaArchivo: "1530",
        modificador: "A"
      },
      batches: [
        {
          header: { codigoServicio: "1234567890123", numeroLote: 1 },
          details: [
            {
              referenciaPrincipal: "123456789012345678901234567890123456789012345678",
              valorRecaudado: 1500.25,
              procedenciaPago: "01",
              medioPago: "11"
            }
          ]
        }
      ]
    });
    const lines = txt.split("\n");
    expect(lines[0]).toHaveLength(162);
    expect(lines[1]).toHaveLength(162);
    expect(lines[2]).toHaveLength(162);
    expect(lines[3]).toHaveLength(162);
    expect(lines[4]).toHaveLength(162);
  });
});
