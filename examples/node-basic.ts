import "dotenv/config";
import PlacetoPayClient, { buildReturnUrl } from "../src";

async function main() {
  const client = PlacetoPayClient.fromEnv();

  const reference = `ORDER_${Date.now()}`;

  const returnUrl = buildReturnUrl(
    process.env.PUBLIC_BASE_URL!,
    "/checkout/resultado",
    { ref: reference }
  );

  // Hooks de depuración: logueamos auth y status de la respuesta
  client["sessions"]["carrier"]["http"]["onRequest"] = async ({ url, body }) => {
    const auth = (body as any)?.auth;
    console.log("\n[onRequest] POST", url);
    console.log("[onRequest] auth:", auth);
  };
  client["sessions"]["carrier"]["http"]["onResponse"] = async ({ url, status, body }) => {
    console.log("[onResponse]", url, "status:", status, "body:", body);
  };

  const session = await client.sessions.create({
    payment: {
      reference,
      description: "Pago UAT de prueba",
      amount: { currency: "UYU", total: 100 }
    },
    ipAddress: "127.0.0.1",
    userAgent: "Node Test",
    returnUrl
  });

  console.log("Process URL:", session.processUrl);
}

main();
