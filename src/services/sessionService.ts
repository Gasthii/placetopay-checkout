import type { Carrier } from "../contracts/carrier";
import type { Logger } from "../core/logger";
import { buildAuth, type Auth, type TimeProvider } from "../core/auth";
import { buildReturnUrl, assertValidUrl } from "../core/url";
import {
  assertAttemptsLimit,
  assertFieldsLimits,
  assertFutureExpiration,
  assertLocalePattern
} from "../core/validation";
import { assertMetadataFormat } from "../core/metadata";
import { normalizeCountry, validateDocument } from "../core/documents";
import type {
  RedirectRequest,
  RedirectResponse,
  RedirectInformation
} from "../domain/redirect";
import type { SessionStatusCode } from "../domain/status";
import {
  PlacetoPayError,
  PlacetoPayStatusError,
  PlacetoPayValidationError
} from "../errors/errors";

export interface SessionCreateOptions {
  locale?: string;
  authOverride?: Auth;
}

export interface WaitForFinalStatusOptions {
  pollIntervalMs?: number;
  maxAttempts?: number;
  finalStatuses?: SessionStatusCode[];
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class SessionService {
  private readonly defaultLocale?: string;
  private readonly returnUrlBase?: string;
  private readonly cancelUrlBase?: string;

  constructor(
    private readonly carrier: Carrier,
    private readonly login: string,
    private readonly secretKey: string,
    private readonly timeProvider: TimeProvider,
    private readonly logger?: Logger,
    defaults?: {
      defaultLocale?: string;
      returnUrlBase?: string;
      cancelUrlBase?: string;
    }
  ) {
    this.defaultLocale = defaults?.defaultLocale;
    this.returnUrlBase = defaults?.returnUrlBase;
    this.cancelUrlBase = defaults?.cancelUrlBase;
  }

  private auth(): Auth {
    return buildAuth(this.login, this.secretKey, this.timeProvider);
  }

  /**
   * Crea una sesión de Checkout (/api/session) con validaciones de expiración, locale, fields y documentos.
   *
   * @param {RedirectRequest} request Debe incluir ipAddress, userAgent y al menos payment|payments|subscription.
   * @param {SessionCreateOptions} [options] locale personalizado o authOverride.
   * @returns {Promise<RedirectResponse>} Respuesta tipada con status OK, requestId y processUrl.
   */
  async create(
    request: RedirectRequest,
    options: SessionCreateOptions = {}
  ): Promise<RedirectResponse> {
    if (!request.ipAddress) throw new PlacetoPayValidationError("ipAddress is required");
    if (!request.userAgent) throw new PlacetoPayValidationError("userAgent is required");
    if (!request.payment && !request.payments && !request.subscription) {
      throw new PlacetoPayValidationError(
        "You must provide payment, payments or subscription"
      );
    }
    assertAttemptsLimit(request.attemptsLimit);

    assertFutureExpiration(request.expiration, this.timeProvider);

    // Si el usuario mando returnUrl directo, se valida.
    // Si no manda, intentamos construirla desde returnUrlBase + metadata.path (pattern pro).
    let returnUrl = request.returnUrl;
    if (!returnUrl && this.returnUrlBase && request.metadata?.returnPath) {
      returnUrl = buildReturnUrl(
        this.returnUrlBase,
        String(request.metadata.returnPath),
        request.metadata?.returnParams as any
      );
    }
    if (!returnUrl) {
      throw new PlacetoPayValidationError("returnUrl is required (direct or via returnUrlBase + metadata.returnPath)");
    }
    assertValidUrl(returnUrl, "returnUrl");

    let cancelUrl = request.cancelUrl;
    if (!cancelUrl && this.cancelUrlBase && request.metadata?.cancelPath) {
      cancelUrl = buildReturnUrl(
        this.cancelUrlBase,
        String(request.metadata.cancelPath),
        request.metadata?.cancelParams as any
      );
      assertValidUrl(cancelUrl, "cancelUrl");
    }

    const auth = options.authOverride ?? this.auth();
    const locale = options.locale ?? request.locale ?? this.defaultLocale ?? "es_UY";
    assertLocalePattern(locale);
    assertFieldsLimits(request.fields, "redirectRequest");
    if (request.payment?.fields) {
      assertFieldsLimits(request.payment.fields, "payment");
    }
    if (Array.isArray(request.payments)) {
      request.payments.forEach((p, idx) => assertFieldsLimits(p?.fields, `payments[${idx}]`));
    }
    if (request.subscription?.fields) {
      assertFieldsLimits(request.subscription.fields, "subscription");
    }
    assertMetadataFormat(request.metadata);

    const buyer = request.buyer
      ? {
          ...request.buyer,
          address: request.buyer.address
            ? {
                ...request.buyer.address,
                country: normalizeCountry(request.buyer.address.country)
              }
            : request.buyer.address
        }
      : undefined;
    const payer = request.payer
      ? {
          ...request.payer,
          address: request.payer.address
            ? {
                ...request.payer.address,
                country: normalizeCountry(request.payer.address.country)
              }
            : request.payer.address
        }
      : undefined;

    validateDocument({
      country: buyer?.address?.country as any,
      documentType: buyer?.documentType,
      document: buyer?.document
    });
    validateDocument({
      country: payer?.address?.country as any,
      documentType: payer?.documentType,
      document: payer?.document
    });

    const body = {
      locale,
      auth,
      payment: request.payment ?? null,
      payments: request.payments,
      subscription: request.subscription,
      expiration: request.expiration,
      returnUrl,
      cancelUrl,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      paymentMethod: request.paymentMethod,
      paymentMethods: request.paymentMethods,
      fields: request.fields,
      buyer,
      payer,
      skipResult: request.skipResult,
      noBuyerFill: request.noBuyerFill,
      type: request.type,
      metadata: request.metadata,
      attemptsLimit: request.attemptsLimit
    };

    const response = await this.carrier.post<RedirectResponse>("/api/session", body);

    if (!response.status) throw new PlacetoPayError("Missing status in create response");
    if (response.status.status !== "OK") {
      throw new PlacetoPayStatusError(
        `Session not created: ${response.status.message}`,
        response.status,
        response
      );
    }
    if (!response.requestId || !response.processUrl) {
      throw new PlacetoPayError("Missing requestId or processUrl");
    }

    this.logger?.info?.("[PlacetoPay] Sesion creada", {
      requestId: response.requestId,
      processUrl: response.processUrl
    });

    return response;
  }

  /**
   * Consulta una sesión por requestId (/api/session/:requestId).
   *
   * @param {number|string} requestId Identificador de sesión.
   * @returns {Promise<RedirectInformation>} Incluye status, request, payment, subscription según docs.
   */
  async get(requestId: number | string): Promise<RedirectInformation> {
    if (requestId === undefined || requestId === null || requestId === "") {
      throw new PlacetoPayValidationError("requestId is required");
    }

    const response = await this.carrier.post<RedirectInformation>(
      `/api/session/${requestId}`,
      { auth: this.auth() }
    );

    if (!response.status) throw new PlacetoPayError("Missing status in query response");
    if (!response.requestId) response.requestId = Number(requestId);

    return response;
  }

  /**
   * Cancela una sesión si no tiene pagos aprobados (/api/session/:requestId/cancel).
   *
   * @param {number|string} requestId Identificador de sesión.
   * @returns {Promise<RedirectInformation>} Status de cancelación REJECTED/MC según doc.
   */
  async cancel(requestId: number | string): Promise<RedirectInformation> {
    const response = await this.carrier.post<RedirectInformation>(
      `/api/session/${requestId}/cancel`,
      { auth: this.auth() }
    );

    if (!response.status) throw new PlacetoPayError("Missing status in cancel response");
    return response;
  }

  /**
   * Sondea hasta alcanzar un estado final (APPROVED, REJECTED, APPROVED_PARTIAL, PARTIAL_EXPIRED).
   *
   * @param {number|string} requestId Sesión a consultar.
   * @param {WaitForFinalStatusOptions} [options] pollIntervalMs, maxAttempts y lista de estados finales.
   * @returns {Promise<RedirectInformation>} Estado final alcanzado o lanza error de timeout.
   */
  async waitForFinalStatus(
    requestId: number | string,
    options: WaitForFinalStatusOptions = {}
  ): Promise<RedirectInformation> {
    const pollIntervalMs = options.pollIntervalMs ?? 4000;
    const maxAttempts = options.maxAttempts ?? 15;
    const finals =
      options.finalStatuses ??
      (["APPROVED", "REJECTED", "APPROVED_PARTIAL", "PARTIAL_EXPIRED"] as SessionStatusCode[]);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const info = await this.get(requestId);
      const s = info.status.status as SessionStatusCode;

      if (finals.includes(s)) return info;

      this.logger?.debug?.("[PlacetoPay] Sesion en proceso", {
        requestId,
        status: s,
        attempt
      });

      await delay(pollIntervalMs);
    }

    throw new PlacetoPayError(
      `Session ${requestId} did not reach a final status in time`,
      "TIMEOUT_FINAL_STATUS"
    );
  }
}

export default SessionService;
