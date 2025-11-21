import type { TimeProvider } from "./auth";
import { PlacetoPayValidationError } from "../errors/errors";
import { assertMetadataFormat } from "./metadata";

const LOCALE_REGEX = /^\w{2}_[A-Z]{2}$/;

export function assertLocalePattern(locale?: string, fieldName = "locale") {
  if (!locale) return;

  if (!LOCALE_REGEX.test(locale)) {
    throw new PlacetoPayValidationError(
      `${fieldName} must match pattern xx_YY (example: es_CO, en_US)`
    );
  }
}

export function assertFutureExpiration(
  expiration: string | undefined,
  timeProvider: TimeProvider,
  minMinutes = 5
) {
  if (!expiration) return;

  const parsed = Date.parse(expiration);

  if (Number.isNaN(parsed)) {
    throw new PlacetoPayValidationError("expiration must be a valid date-time string");
  }

  const now = timeProvider.now().getTime();
  const minAllowed = now + minMinutes * 60_000;

  if (parsed < minAllowed) {
    throw new PlacetoPayValidationError(
      `expiration must be at least ${minMinutes} minutes in the future`
    );
  }
}

export interface FieldLike {
  keyword: string;
  value?: unknown;
  displayOn?: string;
}

export function assertFieldsLimits(
  fields: FieldLike[] | undefined,
  context: string
) {
  if (!fields) return;
  const MAX_FIELDS = 50;
  const MAX_KEYWORD = 50;
  const MAX_VALUE = 255;

  if (fields.length > MAX_FIELDS) {
    throw new PlacetoPayValidationError(`${context}.fields exceeds ${MAX_FIELDS} entries`);
  }

  for (const f of fields) {
    if (!f.keyword || f.keyword.length > MAX_KEYWORD) {
      throw new PlacetoPayValidationError(
        `${context}.fields keyword is required and max ${MAX_KEYWORD} chars`
      );
    }

    if (typeof f.value === "string" && f.value.length > MAX_VALUE) {
      throw new PlacetoPayValidationError(
        `${context}.fields value exceeds ${MAX_VALUE} characters`
      );
    }

    if (f.displayOn && !["none", "payment", "receipt", "both", "approved"].includes(f.displayOn)) {
      throw new PlacetoPayValidationError(
        `${context}.fields displayOn must be one of none|payment|receipt|both|approved`
      );
    }
  }
}

export function assertAttemptsLimit(attemptsLimit?: number) {
  if (attemptsLimit === undefined) return;
  if (attemptsLimit <= 0) {
    throw new PlacetoPayValidationError("attemptsLimit must be greater than 0");
  }
}
