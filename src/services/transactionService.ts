import type { Carrier } from "../contracts/carrier";
import { buildAuth, type Auth, type TimeProvider } from "../core/auth";
import type { Amount } from "../domain/amount";
import type { RedirectInformation } from "../domain/redirect";
import type { TransactionActionRequest } from "../domain/transaction";
import {
  PlacetoPayError,
  PlacetoPayValidationError
} from "../errors/errors";

export class TransactionService {
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
   * Ejecuta acciones de preautorización (checkout/reauthorization/reverse) sobre un internalReference.
   *
   * @param {TransactionActionRequest} req Debe incluir action y internalReference; amount para checkout/reauthorization.
   * @returns {Promise<RedirectInformation>} Respuesta de checkout API con status/payment tipado.
   */
  async action(req: TransactionActionRequest): Promise<RedirectInformation> {
    if (!req.action) throw new PlacetoPayValidationError("action is required");
    if (!req.internalReference && req.internalReference !== 0) {
      throw new PlacetoPayValidationError("internalReference is required");
    }

    const body = {
      auth: this.auth(),
      action: req.action,
      internalReference: req.internalReference,
      amount: req.amount,
      fields: req.fields
    };

    const response = await this.carrier.post<RedirectInformation>(
      "/api/transaction",
      body
    );

    if (!response.status) throw new PlacetoPayError("Missing status in transaction response");
    return response;
  }

  checkout(internalReference: number, amount: Amount) {
    return this.action({ action: "checkout", internalReference, amount });
  }

  /**
   * Alias para reauthorization.
   */
  reauthorize(internalReference: number, amount: Amount) {
    return this.action({ action: "reauthorization", internalReference, amount });
  }

  reverse(
    internalReference: number,
    fields?: import("../domain/payment").NameValuePair[]
  ) {
    return this.action({ action: "reverse", internalReference, fields });
  }
}

export default TransactionService;
