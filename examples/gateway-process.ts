import "dotenv/config";
import PlacetoPayClient from "../src";

async function main() {
  const client = PlacetoPayClient.fromEnv();
  // Importante: Define PLACETOPAY_GATEWAY_BASE_URL (ej. https://api-co-dev.placetopay.ws) para gateway.

  const response = await client.gateway.process({
    payment: {
      reference: `PAY-${Date.now()}`,
      description: "Gateway process demo",
      amount: { currency: "USD", total: 100 },
      allowPartial: false
    },
    instrument: {
      card: {
        // Tarjeta de pruebas Visa (aprueba). Ver lista completa en docs.
        number: "4110760000000081",
        expiration: "1229",
        cvv: "123"
      }
    },
    payer: {
      name: "Gaston",
      surname: "Melo",
      email: "gaston.melo@example.com",
      documentType: "UYCI",
      document: "4598765-4"
    },
    ipAddress: "127.0.0.1",
    userAgent: "gateway-process-example",
    locale: "es_UY"
  });

  console.log("Gateway process status:", response.status.status);
  console.log("internalReference:", response.payment?.[0]?.internalReference);
}

main().catch((err) => {
  console.error("process error", err);
  process.exit(1);
});
