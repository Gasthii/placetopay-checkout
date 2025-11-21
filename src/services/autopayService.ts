import type { Carrier } from "../contracts/carrier";
import type {
  AutopayCreateRequest,
  AutopayCreateResponse,
  AutopayUpdateRequest,
  AutopayBasicResponse
} from "../domain/autopay";
import { PlacetoPayError, PlacetoPayValidationError } from "../errors/errors";
import { buildAuth, type Auth, type TimeProvider } from "../core/auth";

export class AutopayService {
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
   * Crea una programación de autopago según autopay.mdx.
   *
   * @param {AutopayCreateRequest} req Debe incluir subscription con token/reference y schedule documentado.
   * @returns {Promise<AutopayCreateResponse>} status + id + processUrl si la doc lo define.
   */
  async create(req: AutopayCreateRequest): Promise<AutopayCreateResponse> {
    if (!req.subscription) throw new PlacetoPayValidationError("subscription is required");
    const body = { ...req, auth: this.auth() };
    const res = await this.carrier.post<AutopayCreateResponse>("/gateway/autopay/create", body);
    if (!res.status) throw new PlacetoPayError("Missing status in autopay create");
    return res;
  }

  /**
   * Actualiza un autopago.
   *
   * @param {AutopayUpdateRequest} req Debe incluir subscription.id y los cambios permitidos.
   * @returns {Promise<AutopayBasicResponse>} status documentado.
   */
  async update(req: AutopayUpdateRequest): Promise<AutopayBasicResponse> {
    if (!req.subscription) throw new PlacetoPayValidationError("subscription is required");
    const body = { ...req, auth: this.auth() };
    const res = await this.carrier.post<AutopayBasicResponse>("/gateway/autopay/update", body);
    if (!res.status) throw new PlacetoPayError("Missing status in autopay update");
    return res;
  }

  /**
   * Cancela un autopago existente.
   *
   * @param {number|string} autopayId Identificador documentado en autopay.mdx.
   * @returns {Promise<AutopayBasicResponse>} status OK/FAILED según respuesta.
   */
  async cancel(autopayId: number | string): Promise<AutopayBasicResponse> {
    if (autopayId === undefined || autopayId === null || autopayId === "") {
      throw new PlacetoPayValidationError("autopayId is required");
    }
    const res = await this.carrier.post<AutopayBasicResponse>("/gateway/autopay/cancel", {
      auth: this.auth(),
      id: autopayId
    });
    if (!res.status) throw new PlacetoPayError("Missing status in autopay cancel");
    return res;
  }

  /**
   * Busca autopagos con filtros documentados.
   *
   * @param {Record<string, unknown>} [filters] Filtros opcionales que describe la doc.
   * @returns {Promise<AutopayBasicResponse>} status y data.
   */
  async search(filters?: Record<string, unknown>): Promise<AutopayBasicResponse> {
    const res = await this.carrier.post<AutopayBasicResponse>("/gateway/autopay/search", {
      auth: this.auth(),
      filters
    });
    if (!res.status) throw new PlacetoPayError("Missing status in autopay search");
    return res;
  }

  /**
   * Consulta transacciones asociadas a un autopago.
   *
   * @param {number|string} autopayId Identificador del autopago.
   * @returns {Promise<AutopayBasicResponse>} status y listado según la doc.
   */
  async transactions(autopayId: number | string): Promise<AutopayBasicResponse> {
    if (autopayId === undefined || autopayId === null || autopayId === "") {
      throw new PlacetoPayValidationError("autopayId is required");
    }
    const res = await this.carrier.post<AutopayBasicResponse>("/gateway/autopay/transactions", {
      auth: this.auth(),
      id: autopayId
    });
    if (!res.status) throw new PlacetoPayError("Missing status in autopay transactions");
    return res;
  }
}

export default AutopayService;
