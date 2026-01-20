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
  const expiration = new Date(Date.now() + 10 * 60_000).toISOString();

  // Hooks de depuracion: logueamos auth y status de la respuesta (solo debugging)
  const httpDebug = (client as any)?.sessions?.carrier?.http as
    | {
      onRequest?: (ctx: { url: string; body: unknown; attempt?: number }) => unknown;
      onResponse?: (ctx: {
        url: string;
        status: number;
        body: unknown;
        rawBody?: string;
        attempt?: number;
      }) => unknown;
    }
    | undefined;

  if (httpDebug) {
    httpDebug.onRequest = async ({ url, body }) => {
      const auth = (body as any)?.auth;
      console.log("\n[onRequest] POST", url);
      console.log("[onRequest] auth:", auth);
    };
    httpDebug.onResponse = async ({ url, status, body }) => {
      console.log("[onResponse]", url, "status:", status, "body:", body);
    };
  }

  const session = await client.sessions.create({
    locale: "es_UY",
    // auth: {{auth}} // SDK handles auth automatically
    payer: {
      name: "Mack Barrows",
      surname: "Contreras",
      email: "testp2psky@gmail.com",
      mobile: "+59890000000",
      documentType: "UYCI",
      document: "4639596-0"
    },
    payment: {
      reference: "API_SALEPLAN18083-13",
      description: "Pago básico de prueba",
      amount: {
        currency: "UYU",
        total: 100,
        taxes: [
          {
            kind: "valueAddedTax",
            amount: 5,
            base: 90
          }
        ],
        details: [
          {
            kind: "subtotal",
            amount: 90
          }
        ]
      },
      modifiers: [
        {
          type: "FEDERAL_GOVERNMENT",
          code: 18083,
          additional: {
            invoice: "05678"
          }
        }
      ]
    },
    expiration,
    ipAddress: "127.0.0.1",
    userAgent: "Node Test (UY)",
    returnUrl
  });

  console.log("Process URL:", session.processUrl);
}

main();
