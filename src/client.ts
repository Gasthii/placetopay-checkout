import type { PlacetoPayConfig } from "./core/config";
import { SystemTimeProvider, OffsetTimeProvider } from "./core/auth";
import HttpClient from "./core/httpClient";
import RestCarrier from "./carrier/restCarrier";
import SessionService from "./services/sessionService";
import TransactionService from "./services/transactionService";
import RefundService from "./services/refundService";
import WebhookVerifier from "./services/webhookVerifier";
import { PlacetoPayValidationError } from "./errors/errors";

export class PlacetoPayClient {
  public readonly sessions: SessionService;
  public readonly transactions: TransactionService;
  public readonly refunds: RefundService;
  public readonly webhooks: WebhookVerifier;

  constructor(config: PlacetoPayConfig) {
    if (!config.login) throw new PlacetoPayValidationError("login is required");
    if (!config.secretKey) throw new PlacetoPayValidationError("secretKey is required");
    if (!config.baseUrl) throw new PlacetoPayValidationError("baseUrl is required");

    const http = new HttpClient(config);
    const carrier = new RestCarrier(http);
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
  }

  static fromEnv(prefix = "PLACETOPAY_"): PlacetoPayClient {
    const login = process.env[`${prefix}LOGIN`];
    const secretKey = process.env[`${prefix}SECRET_KEY`];
    const baseUrl = process.env[`${prefix}BASE_URL`];
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
      defaultLocale: process.env[`${prefix}DEFAULT_LOCALE`],
      returnUrlBase: process.env.PUBLIC_BASE_URL,
      cancelUrlBase: process.env.PUBLIC_BASE_URL,
      timeProvider
    });
  }
}

export default PlacetoPayClient;

function resolveTimeProviderFromEnv(prefix: string) {
  const offsetMsRaw = process.env[`${prefix}TIME_OFFSET_MS`];
  if (offsetMsRaw && !Number.isNaN(Number(offsetMsRaw))) {
    return new OffsetTimeProvider(Number(offsetMsRaw));
  }

  const offsetMinutesRaw = process.env[`${prefix}TIME_OFFSET_MINUTES`];
  if (offsetMinutesRaw && !Number.isNaN(Number(offsetMinutesRaw))) {
    return new OffsetTimeProvider(Number(offsetMinutesRaw) * 60_000);
  }

  return new SystemTimeProvider();
}
