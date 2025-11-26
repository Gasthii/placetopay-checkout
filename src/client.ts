import type { PlacetoPayConfig } from "./core/config";
import { SystemTimeProvider, OffsetTimeProvider } from "./core/auth";
import HttpClient from "./core/httpClient";
import RestCarrier from "./carrier/restCarrier";
import SessionService from "./services/sessionService";
import TransactionService from "./services/transactionService";
import RefundService from "./services/refundService";
import WebhookVerifier from "./services/webhookVerifier";
import GatewayService from "./services/gatewayService";
import ReportService from "./services/reportService";
import PaymentLinkService from "./services/paymentLinkService";
import AutopayService from "./services/autopayService";
import { PlacetoPayValidationError } from "./errors/errors";

/**
 * Cliente principal para acceder a los servicios de PlacetoPay (sessions, transactions, refunds, webhooks).
 */
export class PlacetoPayClient {
  public readonly sessions: SessionService;
  public readonly transactions: TransactionService;
  public readonly refunds: RefundService;
  public readonly webhooks: WebhookVerifier;
  public readonly gateway: GatewayService;
  public readonly paymentLinks: PaymentLinkService;
  public readonly autopay: AutopayService;
  public readonly reports: ReportService;

  /**
   * Crea un cliente a partir de la configuracion tipada.
   */
  constructor(config: PlacetoPayConfig) {
    if (!config.login) throw new PlacetoPayValidationError("login is required");
    if (!config.secretKey) throw new PlacetoPayValidationError("secretKey is required");
    if (!config.baseUrl) throw new PlacetoPayValidationError("baseUrl is required");

    const http = new HttpClient(config);
    const carrier = new RestCarrier(http);
    const gatewayHttp =
      config.gatewayBaseUrl && config.gatewayBaseUrl !== config.baseUrl
        ? new HttpClient({ ...config, baseUrl: config.gatewayBaseUrl })
        : http;
    const gatewayCarrier =
      config.gatewayBaseUrl && config.gatewayBaseUrl !== config.baseUrl
        ? new RestCarrier(gatewayHttp)
        : carrier;
    const timeProvider = config.timeProvider ?? new SystemTimeProvider();

    this.sessions = new SessionService(
      carrier,
      config.login,
      config.secretKey,
      timeProvider,
      config.logger,
      {
        defaultLocale: config.defaultLocale,
        returnUrlBase: config.returnUrlBase,
        cancelUrlBase: config.cancelUrlBase
      }
    );

    this.transactions = new TransactionService(
      carrier,
      config.login,
      config.secretKey,
      timeProvider
    );

    this.refunds = new RefundService(
      carrier,
      config.login,
      config.secretKey,
      timeProvider
    );

    this.webhooks = new WebhookVerifier(config.secretKey);

    this.gateway = new GatewayService(
      gatewayCarrier,
      config.login,
      config.secretKey,
      timeProvider,
      config.logger,
      {
        defaultLocale: config.defaultLocale
      }
    );

    this.paymentLinks = new PaymentLinkService(
      carrier,
      config.login,
      config.secretKey,
      timeProvider
    );

    this.autopay = new AutopayService(
      gatewayCarrier,
      config.login,
      config.secretKey,
      timeProvider
    );

    this.reports = new ReportService(gatewayCarrier, config.login, config.secretKey, timeProvider);
  }

  /**
   * Construye el cliente leyendo variables de entorno con prefijo (por defecto PLACETOPAY_).
   * Requiere LOGIN, SECRET_KEY, BASE_URL; opcional TIME_OFFSET_MS/MINUTES, DEFAULT_LOCALE, DEBUG_AUTH.
   */
  static fromEnv(prefix = "PLACETOPAY_"): PlacetoPayClient {
    const login = process.env[`${prefix}LOGIN`];
    const secretKey = process.env[`${prefix}SECRET_KEY`];
    const baseUrl = process.env[`${prefix}BASE_URL`];
    const gatewayBaseUrl = process.env[`${prefix}GATEWAY_BASE_URL`];
    const timeProvider = resolveTimeProviderFromEnv(prefix);

    if (!login || !secretKey || !baseUrl) {
      throw new PlacetoPayValidationError(
        `Faltan variables de entorno: ${prefix}LOGIN, ${prefix}SECRET_KEY, ${prefix}BASE_URL`
      );
    }

    return new PlacetoPayClient({
      login,
      secretKey,
      baseUrl,
      gatewayBaseUrl,
      defaultLocale: process.env[`${prefix}DEFAULT_LOCALE`],
      returnUrlBase: process.env.PUBLIC_BASE_URL,
      cancelUrlBase: process.env.PUBLIC_BASE_URL,
      timeProvider,
      debugAuth: isTruthy(process.env[`${prefix}DEBUG_AUTH`])
    });
  }
}

export default PlacetoPayClient;

/**
  * Resuelve TimeProvider leyendo offsets desde env y valida rangos seguros.
  */
function resolveTimeProviderFromEnv(prefix: string) {
  const offsetMsRaw = process.env[`${prefix}TIME_OFFSET_MS`];
  const offsetMinutesRaw = process.env[`${prefix}TIME_OFFSET_MINUTES`];

  const offsetMs =
    parseOffset(offsetMsRaw) ??
    (parseOffset(offsetMinutesRaw) != null
      ? Number(offsetMinutesRaw) * 60_000
      : undefined);

  if (offsetMs != null) {
    validateOffsetRange(offsetMs, prefix);
    return new OffsetTimeProvider(offsetMs);
  }

  return new SystemTimeProvider();
}

function parseOffset(raw?: string) {
  if (raw === undefined || raw === null) return undefined;
  const asNumber = Number(raw);
  if (Number.isNaN(asNumber)) return undefined;
  return asNumber;
}

function validateOffsetRange(offsetMs: number, prefix: string) {
  const MAX_OFFSET_MS = 30 * 60_000; // +/-30 minutos
  if (Math.abs(offsetMs) > MAX_OFFSET_MS) {
    throw new PlacetoPayValidationError(
      `${prefix}TIME_OFFSET_MS/MINUTES es demasiado grande (max +/-30 minutos). Valor recibido: ${offsetMs}ms`
    );
  }
}

function isTruthy(value: string | undefined) {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}
