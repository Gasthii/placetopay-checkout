import { randomBytes, createHash } from "crypto";

export interface Auth {
  login: string;
  tranKey: string;
  nonce: string;
  seed: string;
}

export interface TimeProvider {
  now(): Date;
}

export class SystemTimeProvider implements TimeProvider {
  now(): Date {
    return new Date();
  }
}

/**
 * Permite ajustar el reloj usado para la firma (seed) en caso de skew.
 * offsetMs puede ser positivo o negativo.
 */
export class OffsetTimeProvider implements TimeProvider {
  constructor(private readonly offsetMs: number) {}

  now(): Date {
    return new Date(Date.now() + this.offsetMs);
  }
}

/**
 * Genera el bloque auth requerido por PlacetoPay (login, tranKey, nonce, seed).
 * - seed: ISO string generado con el timeProvider.
 * - nonce: bytes aleatorios en base64 (puede inyectarse en tests via nonceGenerator).
 * - tranKey: SHA-256(nonce + seed + secretKey) en base64.
 */
export function buildAuth(
  login: string,
  secretKey: string,
  timeProvider: TimeProvider = new SystemTimeProvider(),
  nonceGenerator: () => Buffer = () => randomBytes(16)
): Auth {
  const seed = timeProvider.now().toISOString();

  // Nonce en bytes crudos (16 bytes); se envia en base64 y se usa crudo en el hash
  const nonceBytes = nonceGenerator();
  const tranKey = createHash("sha256")
    .update(
      Buffer.concat([
        nonceBytes,
        Buffer.from(seed, "utf8"),
        Buffer.from(secretKey, "utf8")
      ])
    )
    .digest("base64");

  const nonce = nonceBytes.toString("base64");

  return { login, tranKey, nonce, seed };
}
