import "dotenv/config";
import PlacetoPayClient from "../src";

async function main() {
  const client = PlacetoPayClient.fromEnv();

  const link = await client.paymentLinks.create({
    amount: { currency: "USD", total: 120 },
    reference: `LINK-${Date.now()}`,
    description: "Payment link demo",
    expiration: new Date(Date.now() + 30 * 60_000).toISOString(),
    returnUrl: `${process.env.PUBLIC_BASE_URL || "http://localhost:3000"}/payment-link/return`
  });

  console.log("Payment link status:", link.status.status);
  console.log("Payment link URL:", link.url);
}

main().catch((err) => {
  console.error("payment-link error", err);
  process.exit(1);
});
