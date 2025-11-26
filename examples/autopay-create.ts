import "dotenv/config";
import PlacetoPayClient from "../src";

async function main() {
  const client = PlacetoPayClient.fromEnv();

  const res = await client.autopay.create({
    locale: "es_UY",
    subscription: {
      reference: `AUTOPAY-${Date.now()}`,
      description: "Autopay demo",
      amount: { currency: "USD", total: 30 },
      recurring: {
        periodicity: "M",
        interval: 1,
        nextPayment: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        maxPeriods: 6
      }
    },
    returnUrl: `${process.env.PUBLIC_BASE_URL || "http://localhost:3000"}/autopay/return`
  });

  console.log("Autopay status:", res.status.status);
  console.log("Autopay id/processUrl:", res.id, res.processUrl);
}

main().catch((err) => {
  console.error("autopay error", err);
  process.exit(1);
});
