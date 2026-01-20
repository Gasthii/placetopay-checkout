import type { Carrier } from "../contracts/carrier";
import { buildAuth, type TimeProvider } from "../core/auth";
import type { GatewayReportRequest } from "../domain/gateway";
import { PlacetoPayError, PlacetoPayValidationError } from "../errors/errors";
import type { GatewayReportResponse } from "../domain/gateway";

/**
 * Maneja generacion y obtencion de reportes (/gateway/report y /gateway/report/obtain).
 */
export class ReportService {
  constructor(
    private readonly carrier: Carrier,
    private readonly login: string,
    private readonly secretKey: string,
    private readonly timeProvider: TimeProvider
  ) { }

  private auth() {
    return buildAuth(this.login, this.secretKey, this.timeProvider);
  }

  /**
   * Solicita la generacion de un reporte (gateway/report).
   *
   * @param {Omit<GatewayReportRequest,"id"> & { callbackUrl?: string }} req Filtros permitidos y callbackUrl opcional.
   * @returns {Promise<GatewayReportResponse>} Respuesta con status y datos del reporte.
   */
  async requestReport(req: Omit<GatewayReportRequest, "id"> & { callbackUrl?: string }) {
    const body = { ...req, auth: this.auth() };
    const res = await this.carrier.post<GatewayReportResponse>("/gateway/report", body);
    if (!res.status) throw new PlacetoPayError("Missing status in gateway report");
    return res;
  }

  /**
   * Obtiene el contenido del reporte previamente solicitado (texto/CSV).
   *
   * @param {number|string} id Identificador del reporte generado.
   * @returns {Promise<string>} Contenido plano (CSV) segun docs.
   */
  async obtainReport(id: number | string) {
    if (id === undefined || id === null || id === "") {
      throw new PlacetoPayValidationError("id is required");
    }
    const body = { auth: this.auth(), id };
    // Respuesta documentada como texto/CSV
    const res = await this.carrier.post<string>("/gateway/report/obtain", body, {
      headers: { Accept: "text/plain" }
    });
    return res;
  }
}

export default ReportService;
