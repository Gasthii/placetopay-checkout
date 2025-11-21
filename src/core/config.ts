import type { Logger } from "./logger";
import type { RetryPolicy } from "./retry";
import type { TimeProvider } from "./auth";

/**
 * Configuracion principal para inicializar PlacetoPayClient/HttpClient.
 * Agrega JSDoc para mejorar autocompletado en editores.
 */
export interface PlacetoPayConfig {
  login: string;
  secretKey: string;
  baseUrl: string;

  // Defaults opcionales (mejoran DX y evitan hardcodeo repetido)
  defaultLocale?: string;
  returnUrlBase?: string;
  cancelUrlBase?: string;

  // Infra
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  retryPolicy?: RetryPolicy;
  logger?: Logger;
  timeProvider?: TimeProvider;
  /**
   * Habilita logs de seed/nonce por debug (no expone secret). No usar en produccion.
   */
  debugAuth?: boolean;
  /**
   * Headers extra que se envian en cada request HTTP.
   */
  extraHeaders?: Record<string, string>;
  /**
   * Nombre del header de idempotencia (default: Idempotency-Key).
   */
  idempotencyHeader?: string;

  onRequest?(ctx: {
    url: string;
    body: unknown;
    headers: Record<string, string>;
    attempt: number;
  }): void | Promise<void>;

  onResponse?(ctx: {
    url: string;
    status: number;
    body: unknown;
    rawBody: string;
    attempt: number;
  }): void | Promise<void>;
}

export const PlacetoPayEnvironment = {
  CHECKOUT_TEST: "https://checkout-test.placetopay.com",
  CHECKOUT_PROD: "https://checkout.placetopay.com"
} as const;
