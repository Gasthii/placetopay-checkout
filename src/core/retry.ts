import type { Logger } from "./logger";
import { PlacetoPayError, PlacetoPayHttpError } from "../errors/errors";

export interface RetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryOnHttpStatuses?: number[];
}

export const defaultRetryPolicy: RetryPolicy = {
  maxAttempts: 3,
  baseDelayMs: 250,
  maxDelayMs: 2000,
  retryOnHttpStatuses: [502, 503, 504]
};

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  policy: RetryPolicy,
  logger?: Logger
): Promise<T> {
  const maxAttempts = Math.max(1, policy.maxAttempts);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (err: any) {
      const lastAttempt = attempt === maxAttempts;
      const httpStatus =
        err instanceof PlacetoPayHttpError ? err.httpStatus : undefined;

      const shouldRetry =
        !lastAttempt &&
        httpStatus != null &&
        policy.retryOnHttpStatuses?.includes(httpStatus);

      if (!shouldRetry) throw err;

      const backoff =
        Math.min(
          policy.baseDelayMs * Math.pow(2, attempt - 1),
          policy.maxDelayMs
        ) * (0.7 + Math.random() * 0.6);

      logger?.warn?.(
        `[PlacetoPay] HTTP ${httpStatus}, reintento ${attempt + 1}/${maxAttempts} en ${Math.round(backoff)}ms`,
        { httpStatus }
      );

      await delay(backoff);
    }
  }

  throw new PlacetoPayError("Retry flow inesperado");
}
