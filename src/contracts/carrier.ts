export interface Carrier {
  post<T>(
    path: string,
    body: unknown,
    options?: { headers?: Record<string, string> }
  ): Promise<T>;

  post<T>(
    path: string,
    body: unknown,
    options?: { headers?: Record<string, string>; idempotencyKey?: string }
  ): Promise<T>;
}
