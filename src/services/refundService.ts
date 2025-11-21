import type { Carrier } from "../contracts/carrier";
import { buildAuth, type Auth, type TimeProvider } from "../core/auth";
import type { RefundRequest, RedirectInformation } from "../domain/redirect";
import {
  PlacetoPayError,
  PlacetoPayValidationError
} from "../errors/errors";

export class RefundService {
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
   * Ejecuta un reembolso (reverse) conforme a placetopay-docs.
   *
   * @param {RefundRequest} req Debe incluir internalReference y opcional amount parcial.
   * @returns {Promise<RedirectInformation>} Status con estructura de redirect/payment documentada.
   */
  async refund(req: RefundRequest): Promise<RedirectInformation> {
    if (!req.internalReference && req.internalReference !== 0) {
      throw new PlacetoPayValidationError("internalReference is required");
    }

    const body = {
      auth: this.auth(),
      internalReference: req.internalReference,
      amount: req.amount,
      fields: req.fields
    };

    const response = await this.carrier.post<RedirectInformation>(
      "/api/reverse",
      body
    );

    if (!response.status) throw new PlacetoPayError("Missing status in reverse response");
    return response;
  }
}

export default RefundService;
