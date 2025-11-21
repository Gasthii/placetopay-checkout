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
  private readonly debugAuth?: boolean;
  private readonly extraHeaders?: Record<string, string>;
  private retryPolicy = defaultRetryPolicy;

  constructor(config: PlacetoPayConfig) {
    if (!config.fetchImpl && !globalThis.fetch) {
      throw new PlacetoPayError(
        "No hay fetch disponible. Use Node >= 18 o pase fetchImpl.",
        "NO_FETCH"
      );
    }

    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.fetchImpl = config.fetchImpl ?? globalThis.fetch;
    this.timeoutMs = config.timeoutMs ?? 15000;
    this.logger = config.logger;
    this.onRequest = config.onRequest;
    this.onResponse = config.onResponse;
    this.debugAuth = config.debugAuth;
    this.extraHeaders = config.extraHeaders;

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
      Accept: "application/json",
      ...(this.extraHeaders ?? {})
    };

    this.onRequest && (await this.onRequest({ url, body, headers, attempt }));
    this.logDebugAuth(url, body);

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
        "Respuesta invalida (no JSON)",
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
      const friendly = describeAuthError(res.status, json, this.baseUrl, path);
      const message = friendly ?? `PlacetoPay respondio HTTP ${res.status}`;
      throw new PlacetoPayHttpError(message, res.status, json);
    }

    return json as T;
  }

  private logDebugAuth(url: string, body: unknown) {
    if (!this.debugAuth || !this.logger?.debug) return;

    if (!isAuthBody(body)) {
      this.logger.debug?.("[PlacetoPay][debugAuth] sin campo auth en body", {
        url
      });
      return;
    }

    const { seed, nonce } = body.auth ?? {};

    this.logger.debug?.("[PlacetoPay][debugAuth]", {
      url,
      seed,
      nonce,
      hasAuth: Boolean(body.auth)
    });
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

function isAuthBody(body: unknown): body is { auth?: { seed?: string; nonce?: string } } {
  return typeof body === "object" && body !== null && "auth" in (body as any);
}

function describeAuthError(
  statusCode: number,
  body: unknown,
  baseUrl: string,
  path: string
): string | null {
  if (statusCode !== 401) return null;

  const status = (body as any)?.status;
  const reasonRaw = status?.reason;
  const messageRaw = status?.message as string | undefined;

  const reasonNumber =
    typeof reasonRaw === "number"
      ? reasonRaw
      : typeof reasonRaw === "string" && !Number.isNaN(Number(reasonRaw))
        ? Number(reasonRaw)
        : undefined;

  const authCodeFromMessage =
    typeof messageRaw === "string"
      ? Number((messageRaw.match(/10[0-3]/) ?? [])[0])
      : undefined;

  const authCode = [authCodeFromMessage, reasonNumber].find(
    (v) => v === 100 || v === 101 || v === 102 || v === 103
  );

  if (!authCode) return null;

  const base = `PlacetoPay rechazo la autenticacion (codigo auth ${authCode})`;
  const hostHint = `host: ${baseUrl}${path}`;

  switch (authCode) {
    case 100:
      return `${base}: faltan credenciales (UsernameToken). ${hostHint}`;
    case 101:
      return `${base}: el login no existe o no corresponde a este ambiente. ${hostHint}`;
    case 102:
      return `${base}: tranKey no coincide con login/secretKey. ${hostHint}`;
    case 103:
      return `${base}: seed fuera de rango (tolerancia +/-5 minutos). ${hostHint}`;
    default:
      return null;
  }
}
