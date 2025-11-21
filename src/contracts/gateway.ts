import type {
  RedirectRequest,
  RedirectResponse,
  RedirectInformation,
  TransactionActionRequest,
  RefundRequest,
  CheckoutNotification
} from "../domain/redirect";

export interface PlacetoPayGateway {
  request(input: RedirectRequest): Promise<RedirectResponse>;
  query(requestId: number | string): Promise<RedirectInformation>;
  cancel(requestId: number | string): Promise<RedirectInformation>;

  transactionAction(input: TransactionActionRequest): Promise<RedirectInformation>;
  reverse(input: RefundRequest): Promise<RedirectInformation>;

  verifyNotification(
    notification: CheckoutNotification,
    secretKeyOverride?: string
  ): boolean;
}
