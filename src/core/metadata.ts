import { PlacetoPayValidationError } from "../errors/errors";

const INITIATOR_VALUES = new Set([
  "AGENT",
  "CARDHOLDER_COF",
  "CARDHOLDER_RECURRING_VARIABLE_AMOUNT",
  "CARDHOLDER_RECURRING_FIXED_AMOUNT",
  "CARDHOLDER_WITH_INSTALLMENTS",
  "MERCHANT_COF",
  "MERCHANT_RECURRING_VARIABLE_AMOUNT",
  "MERCHANT_RECURRING_FIXED_AMOUNT",
  "MERCHANT_WITH_INSTALLMENTS"
]);

const EBT_VALUES = new Set([
  "DIRECT_DELIVERY",
  "CUSTOMER_PICKUP",
  "COMMERCIAL_SHIPPING",
  "OTHER",
  "NOT_AVAILABLE"
]);

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function assertMetadataFormat(metadata?: Record<string, unknown>) {
  if (!metadata) return;

  const { initiatorIndicator, EBTDeliveryIndicator, openingDate } = metadata;

  if (initiatorIndicator && !INITIATOR_VALUES.has(String(initiatorIndicator))) {
    throw new PlacetoPayValidationError(
      `metadata.initiatorIndicator must be one of ${Array.from(INITIATOR_VALUES).join(", ")}`
    );
  }

  if (EBTDeliveryIndicator && !EBT_VALUES.has(String(EBTDeliveryIndicator))) {
    throw new PlacetoPayValidationError(
      `metadata.EBTDeliveryIndicator must be one of ${Array.from(EBT_VALUES).join(", ")}`
    );
  }

  if (openingDate && (!isIsoDate(String(openingDate)))) {
    throw new PlacetoPayValidationError("metadata.openingDate must be YYYY-MM-DD");
  }
}
