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
  private readonly idempotencyHeader?: string;
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
    this.idempotencyHeader = config.idempotencyHeader;

    if (config.retryPolicy) this.retryPolicy = config.retryPolicy;
  }

  private async postOnce<T>(
    path: string,
    body: unknown,
    attempt: number,
    options?: { headers?: Record<string, string> }
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(this.extraHeaders ?? {}),
      ...(options?.headers ?? {})
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
      const ids = extractIds(json);
      this.logger?.error?.("[PlacetoPay] HTTP error", {
        url,
        status: res.status,
        attempt,
        body: json,
        rawBody: rawText?.slice(0, 1000),
        ...ids
      });

      const friendlyAuth = describeAuthError(res.status, json, this.baseUrl, path);
      const friendlyHttp = describeHttpError(res.status, json, this.baseUrl, path);
      const message =
        friendlyAuth ??
        friendlyHttp ??
        `PlacetoPay respondio HTTP ${res.status}${statusMessage(json)}`;

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

  async post<T>(
    path: string,
    body: unknown,
    options?: { headers?: Record<string, string>; idempotencyKey?: string }
  ): Promise<T> {
    const headers = {
      ...(options?.headers ?? {}),
      ...(options?.idempotencyKey
        ? { [this.idempotencyHeader ?? "Idempotency-Key"]: options.idempotencyKey }
        : {})
    };
    return withRetry(
      (attempt) => this.postOnce<T>(path, body, attempt, { headers }),
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

function statusMessage(body: any): string {
  const msg = body?.status?.message ?? body?.message;
  return msg ? `: ${msg}` : "";
}

function extractIds(body: any) {
  const requestId = body?.requestId ?? body?.status?.requestId;
  const reference = body?.reference ?? body?.request?.payment?.reference;
  return { requestId, reference };
}

function describeHttpError(statusCode: number, body: any, baseUrl: string, path: string) {
  if (statusCode === 404) {
    return `PlacetoPay respondio HTTP 404 (Pagina no encontrada). Verifica baseUrl (${baseUrl}) y path ${path} segun host correcto (checkout vs gateway).${statusMessage(body)}`;
  }
  if (statusCode >= 500) {
    return `PlacetoPay respondio HTTP ${statusCode} (server error).${statusMessage(body)}`;
  }
  if (statusCode === 400) {
    return `PlacetoPay respondio HTTP 400 (solicitud invalida).${statusMessage(body)}`;
  }
  return null;
}
