export interface Amount {
  currency: string;
  total: number;

  taxes?: Array<{
    kind?:
      | "valueAddedTax"
      | "exciseDuty"
      | "ice"
      | "airportTax"
      | "stateTax"
      | "reducedStateTax"
      | "municipalTax"
      | string;
    amount?: number;
    base?: number;
  }>;

  details?: Array<{
    kind?:
      | "discount"
      | "additional"
      | "vatDevolutionBase"
      | "shipping"
      | "handlingFee"
      | "insurance"
      | "giftWrap"
      | "subtotal"
      | "fee"
      | "tip"
      | "airline"
      | "interests"
      | string;
    amount?: number;
  }>;

  [key: string]: unknown;
}
