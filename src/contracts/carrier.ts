export interface Carrier {
  post<T>(path: string, body: unknown): Promise<T>;
}
