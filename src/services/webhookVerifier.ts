import { createHash } from "crypto";
import type { CheckoutNotification } from "../domain/notification";

export class WebhookVerifier {
  constructor(private readonly secretKey: string) {}

  verify(
    notification: CheckoutNotification,
    secretKeyOverride?: string
  ): boolean {
    const secret = secretKeyOverride ?? this.secretKey;
    const received = notification.signature ?? "";

    const plain = received.startsWith("sha256:")
      ? received.slice("sha256:".length)
      : received;

    const payload =
      String(notification.requestId) +
      notification.status.status +
      notification.status.date +
      secret;

    const generated = createHash("sha256")
      .update(payload, "utf8")
      .digest("hex");

    return generated === plain;
  }
}

export default WebhookVerifier;
