import type { Carrier } from "../contracts/carrier";
import type {
  PaymentLinkCreateRequest,
  PaymentLinkCreateResponse,
  PaymentLinkGetResponse,
  PaymentLinkDisableResponse
} from "../domain/paymentLink";
import { PlacetoPayError, PlacetoPayValidationError } from "../errors/errors";
import { buildAuth, type TimeProvider, type Auth } from "../core/auth";

export class PaymentLinkService {
  constructor(
    private readonly carrier: Carrier,
    private readonly login: string,
    private readonly secretKey: string,
    private readonly timeProvider: TimeProvider
  ) {}

  private auth(): Auth {
    return buildAuth(this.login, this.secretKey, this.timeProvider);
  }

  /**
   * Crea un Payment Link según los campos documentados (amount, currency, reference, expiration, etc.).
   *
   * @param {Omit<PaymentLinkCreateRequest,"auth">} req Payload sin el auth (se inyecta automáticamente).
   * @returns {Promise<PaymentLinkCreateResponse>} status + url + id conforme a placetopay-docs/payment-links.
   */
  async create(req: Omit<PaymentLinkCreateRequest, "auth">): Promise<PaymentLinkCreateResponse> {
    if (!req.amount) throw new PlacetoPayValidationError("amount is required");
    const body = { ...req, auth: this.auth() };
    const response = await this.carrier.post<PaymentLinkCreateResponse>("/api/payment-link", body);
    if (!response.status) throw new PlacetoPayError("Missing status in payment-link create");
    return response;
  }

  /**
   * Obtiene un Payment Link por id.
   *
   * @param {number|string} linkId Identificador numérico o string según doc.
   * @returns {Promise<PaymentLinkGetResponse>} Detalle del link con status.
   */
  async get(linkId: number | string): Promise<PaymentLinkGetResponse> {
    if (linkId === undefined || linkId === null || linkId === "") {
      throw new PlacetoPayValidationError("linkId is required");
    }
    const response = await this.carrier.post<PaymentLinkGetResponse>(
      `/api/payment-link/${linkId}`,
      { auth: this.auth() }
    );
    return response;
  }

  /**
   * Deshabilita un Payment Link existente.
   *
   * @param {number|string} linkId Identificador del link.
   * @returns {Promise<PaymentLinkDisableResponse>} Status estrictamente tipado.
   */
  async disable(linkId: number | string): Promise<PaymentLinkDisableResponse> {
    if (linkId === undefined || linkId === null || linkId === "") {
      throw new PlacetoPayValidationError("linkId is required");
    }
    const response = await this.carrier.post<PaymentLinkDisableResponse>(
      `/api/payment-link/disable/${linkId}`,
      { auth: this.auth() }
    );
    if (!response.status) throw new PlacetoPayError("Missing status in payment-link disable");
    return response;
  }
}

export default PaymentLinkService;
