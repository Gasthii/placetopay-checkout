import "dotenv/config";
import PlacetoPayClient from "../src";

async function main() {
  const client = PlacetoPayClient.fromEnv();

  const response = await client.gateway.collect({
    locale: "es_UY",
    payment: {
      reference: `COLLECT-${Date.now()}`,
      description: "Cobro con token demo",
      amount: { currency: "USD", total: 50 }
    },
    instrument: {
      token: {
        token: process.env.P2P_TEST_TOKEN || "token_demo_sandbox"
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
    userAgent: "collect-example",
    returnUrl: `${process.env.PUBLIC_BASE_URL || "http://localhost:3000"}/collect/return`
  });

  console.log("Collect status:", response.status?.status);
  console.log("requestId:", (response as any).requestId);
}

main().catch((err) => {
  console.error("collect error", err);
  process.exit(1);
});
