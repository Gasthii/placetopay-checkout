import PlacetoPayClient from "../src";

const client = PlacetoPayClient.fromEnv();

export async function POST(req: Request) {
  const body = await req.json();
  const { reference, total, returnUrl, cancelUrl } = body;

  if (!reference || !total || !returnUrl) {
    return Response.json(
      { ok: false, message: "reference, total y returnUrl son obligatorios" },
      { status: 400 }
    );
  }

  const session = await client.sessions.create({
    payment: {
      reference,
      description: `Pedido ${reference}`,
      amount: { currency: "UYU", total }
    },
    ipAddress: req.headers.get("x-forwarded-for") ?? "127.0.0.1",
    userAgent: req.headers.get("user-agent") ?? "Next.js",
    returnUrl,
    cancelUrl
  });

  return Response.json({
    ok: true,
    requestId: session.requestId,
    processUrl: session.processUrl
  });
}
