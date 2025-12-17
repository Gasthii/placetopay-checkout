import { createHash } from "crypto";
import type { CheckoutNotification } from "../domain/notification";

export class WebhookVerifier {
  constructor(private readonly secretKey: string) {}

  /**
   * Verifica la firma de notificaciones de checkout según placetopay-docs.
   *
   * La fórmula documentada: SHA-256(requestId + status.status + status.date + secretKey)
   * Si notification.signature inicia con "sha256:", usa SHA-256; si no, se asume SHA-1 (compatibilidad).
   * Se usa timing-safe comparison solo cuando las longitudes coinciden.
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
    const isSha256 = received.startsWith("sha256:");
    const plain = isSha256 ? received.slice("sha256:".length) : received;

    if (!notification.status?.status || !notification.status?.date) return false;

    const payload =
      String(notification.requestId) +
      notification.status.status +
      notification.status.date +
      secret;

    const algo = isSha256 ? "sha256" : "sha1";
    const generated = createHash(algo)
      .update(payload, "utf8")
      .digest("hex");

    if (generated.length !== plain.length) return false;
    return timingSafeCompare(generated, plain);
  }

  /**
   * Verifica la firma pero retorna el motivo de fallo para mejor depuración.
   */
  verifyWithReason(
    notification: CheckoutNotification,
    secretKeyOverride?: string
  ): { valid: boolean; reason?: string } {
    const secret = secretKeyOverride ?? this.secretKey;
    if (!notification.signature) {
      return { valid: false, reason: "missing-signature" };
    }
    if (!notification.status?.status || !notification.status?.date) {
      return { valid: false, reason: "missing-status-or-date" };
    }
    const received = notification.signature;
    const isSha256 = received.startsWith("sha256:");
    const plain = isSha256 ? received.slice("sha256:".length) : received;

    const payload =
      String(notification.requestId) +
      notification.status.status +
      notification.status.date +
      secret;

    const algo = isSha256 ? "sha256" : "sha1";
    const generated = createHash(algo)
      .update(payload, "utf8")
      .digest("hex");

    if (generated.length !== plain.length) {
      return { valid: false, reason: "length-mismatch" };
    }
    const match = timingSafeCompare(generated, plain);
    return match ? { valid: true } : { valid: false, reason: "signature-mismatch" };
  }
}

export default WebhookVerifier;

function timingSafeCompare(generatedHex: string, receivedHex: string) {
  const a = Buffer.from(generatedHex, "hex");
  const b = Buffer.from(receivedHex, "hex");
  if (a.length !== b.length) return false;
  // @ts-ignore: timingSafeEqual existe en crypto v12+
  const { timingSafeEqual } = require("crypto");
  return timingSafeEqual(a, b);
}
