import { PlacetoPayValidationError } from "../errors/errors";

type CountryCode =
  | "CO"
  | "EC"
  | "PR"
  | "CR"
  | "CL"
  | "PA"
  | "BR"
  | "PE"
  | "HN"
  | "BZ"
  | "UY";

const validators: Record<CountryCode, Record<string, RegExp>> = {
  CO: {
    CC: /^[1-9][0-9]{3,9}$/,
    CE: /^([a-zA-Z]{1,5})?[1-9][0-9]{3,7}$/,
    TI: /^[1-9][0-9]{4,11}$/,
    NIT: /^[1-9]\d{6,9}$/,
    RUT: /^[1-9]\d{6,9}$/
  },
  EC: {
    CI: /^\d{10}$/,
    RUC: /^\d{13}$/
  },
  PR: {
    EIN: /^[1-9]\d?-\d{7}$/
  },
  CR: {
    CRCPF: /^[1-9][0-9]{8}$/,
    CPJ: /^[1-9][0-9]{9}$/,
    DIMEX: /^[1-9][0-9]{10,11}$/,
    DIDI: /^[1-9][0-9]{10,11}$/
  },
  CL: {
    CLRUT: /^(\d{1,2}(?:\.?\d{1,3}){2}-[\dKk])$/
  },
  PA: {
    CIP: /^(N|E|PE\d+)?\d{2,6}\d{2,6}$/,
    PARUC: /^[a-zA-Z0-9\-]{1,16}$/
  },
  BR: {
    CPF: /^\d{10,11}$/
  },
  PE: {
    DNI: /^\d{8}$/,
    PERUC: /^(10|15|16|17|20)\d{9}$/
  },
  HN: {
    HNDNI: /^[a-zA-Z0-9]{1,15}$/,
    HNDR: /^[a-zA-Z0-9]{1,15}$/,
    RTN: /^[0-9]{14,16}$/
  },
  BZ: {
    BZSSN: /^[0-9]{9}$/,
    BRN: /^[0-9]{5,7}$/
  },
  UY: {
    UYCI: /^\d{6,7}-[0-9]$/,
    UYRUT: /^\d{12}$/
  }
};

export interface DocumentValidationOptions {
  country?: CountryCode;
  documentType?: string;
  document?: string;
}

export function validateDocument(opts: DocumentValidationOptions) {
  const { country, documentType, document } = opts;
  if (!country || !documentType || !document) return;
  const countryValidators = validators[country];
  if (!countryValidators) return;

  const regex = countryValidators[documentType];
  if (!regex) {
    throw new PlacetoPayValidationError(
      `documentType ${documentType} no soportado para pais ${country}`
    );
  }

  if (!regex.test(document)) {
    throw new PlacetoPayValidationError(
      `document ${document} no cumple formato para ${documentType} (${country})`
    );
  }
}

export function normalizeCountry(country?: string): CountryCode | undefined {
  if (!country) return undefined;
  const upper = country.toUpperCase();
  return upper as CountryCode;
}
