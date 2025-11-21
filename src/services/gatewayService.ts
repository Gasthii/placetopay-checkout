import type { Carrier } from "../contracts/carrier";
import type { Logger } from "../core/logger";
import { buildAuth, type Auth, type TimeProvider } from "../core/auth";
import { assertValidUrl } from "../core/url";
import { assertFutureExpiration, assertLocalePattern } from "../core/validation";
import { assertMetadataFormat } from "../core/metadata";
import type {
  CollectRequest,
  CollectResponse,
  GatewayInformationRequest,
  GatewayTokenRequest,
  InstrumentInvalidateRequest
} from "../domain/instrument";
import type {
  GatewayAccountValidatorRequest,
  GatewayCashOrderRequest,
  GatewayOtpRequest,
  GatewayPinpadRequest,
  GatewayProcessRequest,
  GatewayProcessResponse,
  GatewayQueryRequest,
  GatewayQueryResponse,
  GatewayReportRequest,
  GatewaySearchRequest,
  GatewayTokenizeRequest,
  GatewayTransactionRequest,
  GatewayTransactionResponse,
  Gateway3dsRequest,
  GatewayStatus
} from "../domain/gateway";
import type {
  GatewayAccountValidatorResponse,
  GatewayCashOrderResponse,
  GatewayInformationResponse,
  GatewayOtpResponse,
  GatewayPinpadResponse,
  GatewayReportResponse,
  GatewayThreeDSResponse,
  GatewayTokenLookupResponse,
  GatewayTokenizeResponse,
  GatewaySearchResponse
} from "../domain/gatewayExtra";
import { PlacetoPayError, PlacetoPayValidationError } from "../errors/errors";

/**
 * Servicio que agrupa los endpoints de Gateway descritos en placetopay-docs.
 *
 * Las respuestas de gateway usan estados estrictos:
 * - status.status: "OK" | "FAILED" | "APPROVED" | "PENDING" | "REJECTED" (según el endpoint)
 * - reason/message: provienen del gateway y se modelan sin ampliar más allá de la doc.
 *
 * @typedef {import("../domain/gateway").GatewayProcessRequest} GatewayProcessRequest
 * @typedef {import("../domain/gateway").GatewayProcessResponse} GatewayProcessResponse
 * @typedef {import("../domain/gateway").GatewayTransactionResponse} GatewayTransactionResponse
 * @typedef {import("../domain/gateway").GatewayQueryResponse} GatewayQueryResponse
 * @typedef {import("../domain/gateway").GatewayTransactionRequest} GatewayTransactionRequest
 * @typedef {import("../domain/gateway").GatewayTokenizeRequest} GatewayTokenizeRequest
 * @typedef {import("../domain/gateway").GatewaySearchRequest} GatewaySearchRequest
 * @typedef {import("../domain/gatewayExtra").GatewayTokenizeResponse} GatewayTokenizeResponse
 * @typedef {import("../domain/gatewayExtra").GatewayOtpResponse} GatewayOtpResponse
 * @typedef {import("../domain/gatewayExtra").GatewayThreeDSResponse} GatewayThreeDSResponse
 * @typedef {import("../domain/gatewayExtra").GatewayInformationResponse} GatewayInformationResponse
 * @typedef {import("../domain/gatewayExtra").GatewayTokenLookupResponse} GatewayTokenLookupResponse
 * @typedef {import("../domain/gatewayExtra").GatewayReportResponse} GatewayReportResponse
 * @typedef {import("../domain/gatewayExtra").GatewaySearchResponse} GatewaySearchResponse
 * @typedef {import("../domain/gatewayExtra").GatewayAccountValidatorResponse} GatewayAccountValidatorResponse
 * @typedef {import("../domain/gatewayExtra").GatewayCashOrderResponse} GatewayCashOrderResponse
 * @typedef {import("../domain/gatewayExtra").GatewayPinpadResponse} GatewayPinpadResponse
 * @typedef {import("../domain/gatewayExtra").GatewayThreeDSResponse} GatewayThreeDSResponse
 */
export class GatewayService {
  private readonly defaultLocale?: string;

  constructor(
    private readonly carrier: Carrier,
    private readonly login: string,
    private readonly secretKey: string,
    private readonly timeProvider: TimeProvider,
    private readonly logger?: Logger,
    defaults?: {
      defaultLocale?: string;
    }
  ) {
    this.defaultLocale = defaults?.defaultLocale;
  }

  private auth(): Auth {
    return buildAuth(this.login, this.secretKey, this.timeProvider);
  }

  private resolveLocale(locale?: string) {
    const resolved = locale ?? this.defaultLocale ?? "es_UY";
    assertLocalePattern(resolved);
    return resolved;
  }

  /**
   * Ejecuta un cobro directo con token (collect).
   *
   * @param {CollectRequest} request Debe incluir payment, instrument, payer, ipAddress, userAgent y returnUrl.
   * @returns {Promise<CollectResponse>} Respuesta tipada con status y arrays de payment/subscription según docs.
   */
  async collect(request: CollectRequest): Promise<CollectResponse> {
    if (!request.payment) throw new PlacetoPayValidationError("payment is required");
    if (!request.instrument) throw new PlacetoPayValidationError("instrument is required");
    if (!request.payer) throw new PlacetoPayValidationError("payer is required");
    if (!request.ipAddress) throw new PlacetoPayValidationError("ipAddress is required");
    if (!request.userAgent) throw new PlacetoPayValidationError("userAgent is required");
    if (!request.returnUrl) {
      throw new PlacetoPayValidationError("returnUrl is required for collect");
    }

    assertValidUrl(request.returnUrl, "returnUrl");
    assertFutureExpiration(request.expiration, this.timeProvider);
    assertMetadataFormat(request.metadata);

    const locale = this.resolveLocale(request.locale);

    const body = {
      locale,
      auth: this.auth(),
      payment: request.payment,
      instrument: request.instrument,
      payer: request.payer,
      buyer: request.buyer,
      returnUrl: request.returnUrl,
      expiration: request.expiration,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      fields: request.fields,
      type: request.type,
      metadata: request.metadata,
      provider: request.provider
    };

    const response = await this.carrier.post<CollectResponse>("/api/collect", body, {
      idempotencyKey: (request as any).idempotencyKey
    });

    if (!response.status) throw new PlacetoPayError("Missing status in collect response");

    this.logger?.info?.("[PlacetoPay] Collect ejecutado", {
      requestId: (response as any).requestId,
      status: response.status?.status
    });

    return response;
  }

  async invalidateInstrument(request: InstrumentInvalidateRequest) {
    if (!request.instrument) {
      throw new PlacetoPayValidationError("instrument is required");
    }

    /**
     * Invalida un token/subtoken existente.
     *
     * @typedef {{ status: GatewayStatus }} InvalidateInstrumentResponse
     * @param {InstrumentInvalidateRequest} request Requiere instrument.token o instrument.subtoken según doc.
     * @returns {Promise<InvalidateInstrumentResponse>}
     */
    const locale = this.resolveLocale(request.locale);
    const body = {
      locale,
      auth: this.auth(),
      instrument: request.instrument
    };

    const response = await this.carrier.post<{ status?: unknown }>(
      "/api/instrument/invalidate",
      body
    );

    if (!response.status) {
      throw new PlacetoPayError("Missing status in instrument invalidate response");
    }

    return response;
  }

  /**
   * Obtiene información de enrutamiento para un instrumento (gateway/information).
   *
   * @param {GatewayInformationRequest} request Requiere payment, instrument, ipAddress y userAgent.
   * @returns {Promise<GatewayInformationResponse>} Incluye provider, serviceCode, cardTypes y flags 3DS/OTP según doc.
   */
  async instrumentInformation(request: GatewayInformationRequest) {
    if (!request.payment) throw new PlacetoPayValidationError("payment is required");
    if (!request.instrument) throw new PlacetoPayValidationError("instrument is required");
    if (!request.ipAddress) throw new PlacetoPayValidationError("ipAddress is required");
    if (!request.userAgent) throw new PlacetoPayValidationError("userAgent is required");

    assertMetadataFormat((request as any).metadata);

    const locale = this.resolveLocale(request.locale);

    const body = {
      locale,
      auth: this.auth(),
      payment: request.payment,
      instrument: request.instrument,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      provider: request.provider,
      metadata: request.metadata
    };

    const response = await this.carrier.post<GatewayInformationResponse>("/api/gateway/information", body);

    if (!(response as any)?.status) {
      throw new PlacetoPayError("Missing status in gateway information response");
    }

    return response;
  }

  /**
   * Consulta tokenización por token/subtoken (gateway/token).
   *
   * @param {GatewayTokenRequest} request Debe incluir instrument.token y opcional subtoken.
   * @returns {Promise<GatewayTokenLookupResponse>} Retorna status y data de tokenización según docs.
   */
  async lookupToken(request: GatewayTokenRequest) {
    if (!request.instrument) throw new PlacetoPayValidationError("instrument is required");

    const locale = this.resolveLocale(request.locale);

    const body = {
      locale,
      auth: this.auth(),
      instrument: request.instrument
    };

    const response = await this.carrier.post<GatewayTokenLookupResponse>("/api/gateway/token", body);

    if (!(response as any)?.status) {
      throw new PlacetoPayError("Missing status in gateway token response");
    }

    return response;
  }

  /**
   * Procesa una transacción gateway (process) con instrument + payer.
   *
   * @param {GatewayProcessRequest} request Requiere payment, instrument, payer, ipAddress, userAgent.
   * @returns {Promise<GatewayProcessResponse>} Respuesta con status, internalReference, processUrl y processorFields tipados.
   */
  async process(request: GatewayProcessRequest): Promise<GatewayProcessResponse> {
    if (!request.payment) throw new PlacetoPayValidationError("payment is required");
    if (!request.instrument) throw new PlacetoPayValidationError("instrument is required");
    if (!request.payer) throw new PlacetoPayValidationError("payer is required");
    if (!request.ipAddress) throw new PlacetoPayValidationError("ipAddress is required");
    if (!request.userAgent) throw new PlacetoPayValidationError("userAgent is required");

    const locale = this.resolveLocale(request.locale);
    const { idempotencyKey, ...rest } = request;
    const body = { ...rest, locale, auth: this.auth() };

    const response = await this.carrier.post<GatewayProcessResponse>("/gateway/process", body, {
      idempotencyKey
    });
    if (!(response as any)?.status) {
      throw new PlacetoPayError("Missing status in gateway process response");
    }
    return response;
  }

  /**
   * Consulta una transacción por requestId/internalReference/reference (gateway/query).
   *
   * @param {GatewayQueryRequest} request Identificador de consulta (uno de los tres).
   * @returns {Promise<GatewayQueryResponse>} Incluye status, payment list y subscription según docs.
   */
  async query(request: GatewayQueryRequest): Promise<GatewayQueryResponse> {
    if (!request.internalReference && !request.requestId && !request.reference) {
      throw new PlacetoPayValidationError("internalReference, requestId or reference is required");
    }
    const body = { ...request, auth: this.auth() };
    const response = await this.carrier.post<GatewayQueryResponse>("/gateway/query", body);
    if (!(response as any)?.status) {
      throw new PlacetoPayError("Missing status in gateway query response");
    }
    return response;
  }

  /**
   * Busca transacciones por filtros (gateway/search).
   *
   * @param {GatewaySearchRequest} request Filtros documentados (dates, reference, internalReference).
   * @returns {Promise<GatewaySearchResponse>} status + transactions[] tipados según transaction.mdx.
   */
  async search(request: GatewaySearchRequest) {
    const body = { ...request, auth: this.auth() };
    return this.carrier.post<GatewaySearchResponse>("/gateway/search", body);
  }

  /**
   * Ejecuta acciones sobre preautorizaciones: checkout/reauthorization/reverse (gateway/transaction).
   *
   * @param {GatewayTransactionRequest} request Debe incluir action y internalReference.
   * @returns {Promise<GatewayTransactionResponse>} status y detalles de pago según docs.
   */
  async transaction(request: GatewayTransactionRequest): Promise<GatewayTransactionResponse> {
    if (!request.action) throw new PlacetoPayValidationError("action is required");
    if (request.internalReference === undefined || request.internalReference === null) {
      throw new PlacetoPayValidationError("internalReference is required");
    }
    const { idempotencyKey, ...rest } = request;
    const body = { ...rest, auth: this.auth() };
    const response = await this.carrier.post<GatewayTransactionResponse>(
      "/gateway/transaction",
      body,
      { idempotencyKey }
    );
    if (!(response as any)?.status) {
      throw new PlacetoPayError("Missing status in gateway transaction response");
    }
    return response;
  }

  /**
   * Tokeniza un instrumento (gateway/tokenize).
   *
   * @param {GatewayTokenizeRequest} request Requiere instrument y payer/env.
   * @returns {Promise<GatewayTokenizeResponse>} status y campos de tokenización según doc.
   */
  async tokenize(request: GatewayTokenizeRequest) {
    if (!request.instrument) throw new PlacetoPayValidationError("instrument is required");
    const { idempotencyKey, ...rest } = request;
    const body = { ...rest, auth: this.auth() };
    const response = await this.carrier.post<GatewayTokenizeResponse>("/gateway/tokenize", body, {
      idempotencyKey
    });
    if (!(response as any)?.status) {
      throw new PlacetoPayError("Missing status in gateway tokenize response");
    }
    return response;
  }

  /**
   * Valida OTP para un pago (gateway/otp).
   *
   * @param {GatewayOtpRequest} request Requiere internalReference y otp.
   * @returns {Promise<GatewayOtpResponse>} status y processorFields estrictos.
   */
  async otp(request: GatewayOtpRequest) {
    if (!request.internalReference && !request.internalReference) {
      throw new PlacetoPayValidationError("internalReference is required");
    }
    if (!request.otp) throw new PlacetoPayValidationError("otp is required");
    const { idempotencyKey, ...rest } = request;
    const body = { ...rest, auth: this.auth() };
    const response = await this.carrier.post<GatewayOtpResponse>("/gateway/otp", body, {
      idempotencyKey
    });
    if (!(response as any)?.status) {
      throw new PlacetoPayError("Missing status in gateway otp response");
    }
    return response;
  }

  /**
   * Completa flujo 3DS (gateway/3ds).
   *
   * @param {Gateway3dsRequest} request Requiere internalReference y campos 3DS del MDX.
   * @returns {Promise<GatewayThreeDSResponse>} Respuesta con status y processorFields.
   */
  async threeDS(request: Gateway3dsRequest) {
    if (!request.internalReference) {
      throw new PlacetoPayValidationError("internalReference is required");
    }
    const { idempotencyKey, ...rest } = request;
    const body = { ...rest, auth: this.auth() };
    const response = await this.carrier.post<GatewayThreeDSResponse>("/gateway/3ds", body, {
      idempotencyKey
    });
    if (!(response as any)?.status) {
      throw new PlacetoPayError("Missing status in gateway 3ds response");
    }
    return response;
  }

  /**
   * Reporte detallado de transacciones (gateway/report).
   *
   * @param {GatewayReportRequest} request Filtros por internalReference/requestId/reference.
   * @returns {Promise<GatewayReportResponse>} Resumen y transactions tipadas; obtiene status OK/FAILED.
   */
  async report(request: GatewayReportRequest) {
    if (!request.internalReference && !request.requestId && !request.reference) {
      throw new PlacetoPayValidationError("internalReference, requestId or reference is required");
    }
    const { idempotencyKey, ...rest } = request;
    const body = { ...rest, auth: this.auth() };
    const response = await this.carrier.post<GatewayReportResponse>("/gateway/report", body, {
      idempotencyKey
    });
    if (!(response as any)?.status) {
      throw new PlacetoPayError("Missing status in gateway report response");
    }
    return response;
  }

  /**
   * Integra con pinpad físico (gateway/pinpad).
   *
   * @param {GatewayPinpadRequest} request Campos definidos en gateway-pinpad.mdx.
   * @returns {Promise<GatewayPinpadResponse>} Status y datos del pinpad según doc.
   */
  async pinpad(request: GatewayPinpadRequest) {
    const body = { ...request, auth: this.auth() };
    const res = await this.carrier.post<GatewayPinpadResponse>("/gateway/pinpad", body);
    if (!(res as any)?.status) {
      throw new PlacetoPayError("Missing status in gateway pinpad response");
    }
    return res;
  }

  /**
   * Valida cuentas (gateway/account-validator).
   *
   * @param {GatewayAccountValidatorRequest} request Requiere instrument, ipAddress, userAgent.
   * @returns {Promise<GatewayAccountValidatorResponse>} Status y data según account-validator.mdx.
   */
  async accountValidator(request: GatewayAccountValidatorRequest) {
    if (!request.instrument) throw new PlacetoPayValidationError("instrument is required");
    if (!request.ipAddress) throw new PlacetoPayValidationError("ipAddress is required");
    if (!request.userAgent) throw new PlacetoPayValidationError("userAgent is required");
    const body = { ...request, auth: this.auth() };
    const response = await this.carrier.post<GatewayAccountValidatorResponse>(
      "/gateway/account-validator",
      body
    );
    if (!(response as any)?.status) {
      throw new PlacetoPayError("Missing status in gateway account-validator response");
    }
    return response;
  }

  /**
   * Genera orden de efectivo (gateway/cashorder).
   *
   * @param {GatewayCashOrderRequest} request Requiere payment y payer.
   * @returns {Promise<GatewayCashOrderResponse>} Status y links/códigos de pago en efectivo documentados.
   */
  async cashOrder(request: GatewayCashOrderRequest) {
    if (!request.payment) throw new PlacetoPayValidationError("payment is required");
    if (!request.payer) throw new PlacetoPayValidationError("payer is required");
    const body = { ...request, auth: this.auth() };
    const response = await this.carrier.post<GatewayCashOrderResponse>("/gateway/cashorder", body);
    if (!(response as any)?.status) {
      throw new PlacetoPayError("Missing status in gateway cashorder response");
    }
    return response;
  }
}

export default GatewayService;
