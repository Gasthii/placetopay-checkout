import "dotenv/config";
import PlacetoPayClient from "../src";
import type { CheckoutNotification } from "../src/domain/notification";

const client = PlacetoPayClient.fromEnv();

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as CheckoutNotification;

    const valid = client.webhooks.verify(payload);
    if (!valid) {
      return Response.json({ ok: false, message: "Firma invalida" }, { status: 401 });
    }

    // Aqui actualizas tu orden segun payload.status.status y payload.requestId
    // Ejemplo:
    // await Orders.update(payload.reference, {
    //   status: payload.status.status,
    //   reason: payload.status.reason,
    //   date: payload.status.date
    // });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return Response.json({ ok: false, message: "Error procesando webhook" }, { status: 500 });
  }
}
