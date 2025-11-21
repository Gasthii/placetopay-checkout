import type { Carrier } from "../contracts/carrier";
import { HttpClient } from "../core/httpClient";

export class RestCarrier implements Carrier {
  constructor(private readonly http: HttpClient) {}

  post<T>(path: string, body: unknown): Promise<T> {
    return this.http.post<T>(path, body);
  }
}

export default RestCarrier;
