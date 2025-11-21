import PlacetoPayClient from "../src";
import type { CheckoutNotification } from "../src/domain/notification";

const client = PlacetoPayClient.fromEnv();

export async function POST(req: Request) {
  const payload = (await req.json()) as CheckoutNotification;

  const valid = client.webhooks.verify(payload);
  if (!valid) {
    return Response.json({ ok: false, message: "Firma inválida" }, { status: 401 });
  }

  // Acá actualizás tu orden según payload.status.status
  return Response.json({ ok: true });
}
