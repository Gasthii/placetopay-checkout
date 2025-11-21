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
    payment: {
      reference,
      description: "Pago de prueba en UYU",
      amount: {
        currency: "UYU",
        total: 1000,
        taxes: [{ kind: "valueAddedTax", amount: 220, base: 0 }]
      },
      items: [
        {
          sku: "SKU-URU-001",
          name: "Producto prueba Uruguay",
          category: "physical",
          qty: 1,
          price: 1000,
          tax: 220
        }
      ],
      fields: [
        { keyword: "campana", value: "uat_demo", displayOn: "none" }
      ]
    },
    buyer: {
      document: "4598765-4",
      documentType: "UYCI",
      name: "Juan",
      surname: "Perez",
      email: "juan.perez@example.com",
      mobile: "+59898765432",
      address: {
        country: "UY",
        state: "MO",
        city: "Montevideo",
        street: "Av. Italia 1234",
        postalCode: "11300",
        phone: "+59898765432"
      }
    },
    expiration,
    ipAddress: "127.0.0.1",
    userAgent: "Node Test (UY)",
    returnUrl
  });

  console.log("Process URL:", session.processUrl);
}

main();
