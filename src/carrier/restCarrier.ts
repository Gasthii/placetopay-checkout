import type { Carrier } from "../contracts/carrier";
import { HttpClient } from "../core/httpClient";

export class RestCarrier implements Carrier {
  constructor(private readonly http: HttpClient) {}

  post<T>(
    path: string,
    body: unknown,
    options?: { headers?: Record<string, string> }
  ): Promise<T> {
    return this.http.post<T>(path, body, options);
  }
}

export default RestCarrier;
