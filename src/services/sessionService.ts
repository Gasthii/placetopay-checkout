import type { Carrier } from "../contracts/carrier";
import type { Logger } from "../core/logger";
import { buildAuth, type Auth, type TimeProvider } from "../core/auth";
import { buildReturnUrl, assertValidUrl } from "../core/url";
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

    // Si el usuario mandó returnUrl directo, se valida.
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

    const body = {
      locale: options.locale ?? request.locale ?? this.defaultLocale ?? "es_UY",
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
      fields: request.fields,
      buyer: request.buyer,
      payer: request.payer,
      skipResult: request.skipResult,
      noBuyerFill: request.noBuyerFill,
      type: request.type,
      metadata: request.metadata
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

    this.logger?.info?.("[PlacetoPay] Sesión creada", {
      requestId: response.requestId,
      processUrl: response.processUrl
    });

    return response;
  }

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

  async cancel(requestId: number | string): Promise<RedirectInformation> {
    const response = await this.carrier.post<RedirectInformation>(
      `/api/session/${requestId}/cancel`,
      { auth: this.auth() }
    );

    if (!response.status) throw new PlacetoPayError("Missing status in cancel response");
    return response;
  }

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

      this.logger?.debug?.("[PlacetoPay] Sesión en proceso", {
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
