import { createHash } from "crypto";
import type { CheckoutNotification } from "../domain/notification";

export class WebhookVerifier {
  constructor(private readonly secretKey: string) {}

  /**
   * Verifica la firma de notificaciones de checkout según placetopay-docs.
   *
   * La fórmula documentada: SHA-256(requestId + status.status + status.date + secretKey)
   * Si notification.signature inicia con "sha256:", se remueve el prefijo antes de comparar.
   *
   * @param {CheckoutNotification} notification Objeto recibido en el webhook.
   * @param {string} [secretKeyOverride] Clave secreta alternativa (por si manejas múltiples sitios).
   * @returns {boolean} true si la firma coincide exactamente, false en caso contrario.
   */
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
