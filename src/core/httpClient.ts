import type { PlacetoPayConfig } from "./config";
import type { Logger } from "./logger";
import { withRetry, defaultRetryPolicy } from "./retry";
import { PlacetoPayError, PlacetoPayHttpError } from "../errors/errors";

export class HttpClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly logger?: Logger;
  private readonly onRequest?: PlacetoPayConfig["onRequest"];
  private readonly onResponse?: PlacetoPayConfig["onResponse"];
  private retryPolicy = defaultRetryPolicy;

  constructor(config: PlacetoPayConfig) {
    if (!config.fetchImpl && !globalThis.fetch) {
      throw new PlacetoPayError(
        "No hay fetch disponible. Usá Node >= 18 o pasá fetchImpl.",
        "NO_FETCH"
      );
    }

    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.fetchImpl = config.fetchImpl ?? globalThis.fetch;
    this.timeoutMs = config.timeoutMs ?? 15000;
    this.logger = config.logger;
    this.onRequest = config.onRequest;
    this.onResponse = config.onResponse;

    if (config.retryPolicy) this.retryPolicy = config.retryPolicy;
  }

  private async postOnce<T>(
    path: string,
    body: unknown,
    attempt: number
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json"
    };

    this.onRequest && (await this.onRequest({ url, body, headers, attempt }));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    let res: Response;
    try {
      res = (await this.fetchImpl(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      })) as Response;
    } catch (err: any) {
      clearTimeout(timeout);
      this.logger?.error?.("[PlacetoPay] Error de red", { err, url });
      throw new PlacetoPayError(
        `Error de red llamando PlacetoPay: ${err?.message ?? String(err)}`,
        "NETWORK_ERROR"
      );
    }

    clearTimeout(timeout);

    const rawText = await res.text();
    let json: unknown = {};

    try {
      json = rawText ? JSON.parse(rawText) : {};
    } catch {
      throw new PlacetoPayHttpError(
        "Respuesta inválida (no JSON)",
        res.status,
        rawText
      );
    }

    this.onResponse &&
      (await this.onResponse({
        url,
        status: res.status,
        body: json,
        rawBody: rawText,
        attempt
      }));

    if (!res.ok) {
      throw new PlacetoPayHttpError(
        `PlacetoPay respondió HTTP ${res.status}`,
        res.status,
        json
      );
    }

    return json as T;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return withRetry(
      (attempt) => this.postOnce<T>(path, body, attempt),
      this.retryPolicy,
      this.logger
    );
  }
}

export default HttpClient;
