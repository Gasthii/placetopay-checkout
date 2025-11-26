/**
 * Generador de archivos de facturación/recaudo en formato Asobancaria 2001
 * según placetopay-docs (import-payment-orders.mdx).
 *
 * Solo se usan los campos soportados por PlacetoPay (los marcados como “No usado”
 * se ignoran o se rellenan con espacios).
 */

export interface BillingHeader {
  nitEmpresaRecaudadora: string; // 10 NUM requerido
  nitAdicional?: string; // No usado por PlacetoPay, se rellena si se envía
  codigoEntidadOriginadora?: string; // No usado por PlacetoPay
  fechaArchivo: string; // AAAAMMDD
  horaArchivo: string; // HHMM
  modificador: string; // A-Z,0-9
}

export interface BillingBatchHeader {
  codigoServicio: string; // EAN13 o NIT (13 NUM)
  numeroLote: number; // 4 NUM
  descripcionServicio: string; // 15 ALF
}

export interface BillingDetail {
  referenciaPrincipal: string; // 48 NUM
  referenciaSecundaria?: string; // 30 ALF
  periodos?: string | number; // 2 NUM
  ciclo?: string; // 3 ALF
  valorPrincipal: number; // 14 NUM (12 enteros, 2 decimales)
  valorServicioAdicional?: number; // No usado por PlacetoPay
  fechaVencimiento: string; // AAAAMMDD
  fechaCorte: string; // AAAAMMDD
  incrementoDiario: number; // 10 NUM (6 enteros, 4 decimales) <1 porcentual, >=1 fijo
  incrementoTipo: 0 | 1; // 0 valor diario, 1 valor fijo
  identificacionPagador?: string; // 10 ALF
  nombrePagador?: string; // 22 ALF
}

export interface BillingBatch {
  header: BillingBatchHeader;
  details: BillingDetail[];
}

export interface BillingFile {
  header: BillingHeader;
  batches: BillingBatch[];
}

export interface CollectionDetail {
  referenciaPrincipal: string; // 48 NUM
  valorRecaudado: number; // 14 NUM (12 enteros,2 decimales)
  procedenciaPago: string; // 2 NUM
  medioPago: string; // 2 NUM
  numeroOperacion?: string; // 6 NUM
  numeroAutorizacion?: string; // 6 NUM
  secuencia?: number; // 7 NUM
  causalDevolucion?: string; // 3 ALF (No usado por PlacetoPay)
}

export interface CollectionHeader {
  nitEmpresaFacturadora: string; // 10 NUM
  fechaRecaudo: string; // AAAAMMDD
  codigoEntidadRecaudadora: string; // 3 NUM
  numeroCuenta: string; // 17 ALF
  fechaArchivo: string; // AAAAMMDD
  horaArchivo: string; // HHMM
  modificador: string; // A-Z,0-9
  tipoCuenta?: string; // 2 NUM
}

export interface CollectionBatchHeader {
  codigoServicio: string; // 13 NUM
  numeroLote: number; // 4 NUM
}

export interface CollectionBatch {
  header: CollectionBatchHeader;
  details: CollectionDetail[];
}

export interface CollectionFile {
  header: CollectionHeader;
  batches: CollectionBatch[];
}

// Helpers de padding
function padNumeric(value: string, length: number) {
  if (value.length > length) throw new Error(`Numeric too long (${length}): ${value}`);
  return value.padStart(length, "0");
}

function padAlpha(value: string, length: number) {
  if (value.length > length) throw new Error(`Alpha too long (${length}): ${value}`);
  return value.padEnd(length, " ");
}

function formatAmount(value: number, length: number, decimals: number) {
  const scaled = Math.round(value * 10 ** decimals);
  return padNumeric(String(scaled), length);
}

function date8(value: string) {
  if (!/^\d{8}$/.test(value)) throw new Error(`Invalid date format (AAAAMMDD): ${value}`);
  return value;
}

function time4(value: string) {
  if (!/^\d{4}$/.test(value)) throw new Error(`Invalid time format (HHMM): ${value}`);
  return value;
}

function buildBillingHeader(h: BillingHeader) {
  const parts = [
    "01",
    padNumeric(h.nitEmpresaRecaudadora, 10),
    padNumeric(h.nitAdicional ?? "", 10),
    padNumeric(h.codigoEntidadOriginadora ?? "", 3),
    date8(h.fechaArchivo),
    time4(h.horaArchivo),
    padAlpha(h.modificador ?? "A", 1),
    padAlpha("", 182)
  ];
  const line = parts.join("");
  if (line.length !== 220) throw new Error(`Billing header length invalid: ${line.length}`);
  return line;
}

function buildBillingBatchHeader(b: BillingBatchHeader) {
  const parts = [
    "05",
    padNumeric(b.codigoServicio, 13),
    padNumeric(String(b.numeroLote), 4),
    padAlpha(b.descripcionServicio, 15),
    padAlpha("", 186)
  ];
  const line = parts.join("");
  if (line.length !== 220) throw new Error(`Batch header length invalid: ${line.length}`);
  return line;
}

function buildBillingDetail(d: BillingDetail) {
  const parts = [
    "06",
    padNumeric(d.referenciaPrincipal, 48),
    padAlpha(d.referenciaSecundaria ?? "", 30),
    padNumeric(d.periodos ? String(d.periodos) : "", 2),
    padAlpha(d.ciclo ?? "", 3),
    formatAmount(d.valorPrincipal, 14, 2),
    padNumeric("", 13), // servicio adicional no usado
    formatAmount(d.valorServicioAdicional ?? 0, 14, 2),
    date8(d.fechaVencimiento),
    padNumeric("", 8), // EFR banco cliente no usado
    padAlpha("", 17), // cuenta pagador no usado
    padNumeric("", 2), // tipo cuenta no usado
    padAlpha(d.identificacionPagador ?? "", 10),
    padAlpha(d.nombrePagador ?? "", 22),
    padNumeric("", 3), // entidad originadora no usado
    formatAmount(d.incrementoDiario, 10, 4),
    date8(d.fechaCorte),
    padNumeric(String(d.incrementoTipo), 1),
    padAlpha("", 5)
  ];
  const line = parts.join("");
  if (line.length !== 220) throw new Error(`Detail length invalid: ${line.length}`);
  return line;
}

function buildBillingBatchControl(batch: BillingBatch, batchIndex: number) {
  const totalReg = batch.details.length + 2; // header + control + details
  const valorPrincipal = batch.details.reduce((acc, d) => acc + d.valorPrincipal, 0);
  const valorAdicional = batch.details.reduce((acc, d) => acc + (d.valorServicioAdicional ?? 0), 0);

  const parts = [
    "08",
    padNumeric(String(totalReg), 9),
    formatAmount(valorPrincipal, 18, 2),
    formatAmount(valorAdicional, 18, 2),
    padNumeric(String(batchIndex + 1), 4),
    padAlpha("", 169)
  ];
  const line = parts.join("");
  if (line.length !== 220) throw new Error(`Batch control length invalid: ${line.length}`);
  return line;
}

function buildBillingFileControl(file: BillingFile) {
  const allDetails = file.batches.flatMap((b) => b.details);
  const totalRegistrosDetalle = allDetails.length;
  const valorPrincipal = allDetails.reduce((acc, d) => acc + d.valorPrincipal, 0);
  const valorAdicional = allDetails.reduce((acc, d) => acc + (d.valorServicioAdicional ?? 0), 0);
  const parts = [
    "09",
    padNumeric(String(totalRegistrosDetalle), 9),
    formatAmount(valorPrincipal, 18, 2),
    formatAmount(valorAdicional, 18, 2),
    padAlpha("", 173)
  ];
  const line = parts.join("");
  if (line.length !== 220) throw new Error(`File control length invalid: ${line.length}`);
  return line;
}

export function buildBillingFile(file: BillingFile): string {
  const lines: string[] = [];
  lines.push(buildBillingHeader(file.header));
  file.batches.forEach((batch, idx) => {
    lines.push(buildBillingBatchHeader(batch.header));
    batch.details.forEach((d) => lines.push(buildBillingDetail(d)));
    lines.push(buildBillingBatchControl(batch, idx));
  });
  lines.push(buildBillingFileControl(file));
  return lines.join("\n");
}

function buildCollectionHeader(h: CollectionHeader) {
  const parts = [
    "05",
    padNumeric(h.nitEmpresaFacturadora, 10),
    date8(h.fechaRecaudo),
    padNumeric(h.codigoEntidadRecaudadora, 3),
    padAlpha(h.numeroCuenta, 17),
    date8(h.fechaArchivo),
    time4(h.horaArchivo),
    padAlpha(h.modificador, 1),
    padNumeric(h.tipoCuenta ?? "", 2),
    padAlpha("", 107)
  ];
  const line = parts.join("");
  if (line.length !== 162) throw new Error(`Collection header length invalid: ${line.length}`);
  return line;
}

function buildCollectionBatchHeader(h: CollectionBatchHeader) {
  const parts = [
    "05",
    padNumeric(h.codigoServicio, 13),
    padNumeric(String(h.numeroLote), 4),
    padAlpha("", 143)
  ];
  const line = parts.join("");
  if (line.length !== 162) throw new Error(`Collection batch header length invalid: ${line.length}`);
  return line;
}

function buildCollectionDetail(d: CollectionDetail) {
  const parts = [
    "06",
    padNumeric(d.referenciaPrincipal, 48),
    formatAmount(d.valorRecaudado, 14, 2),
    padNumeric(d.procedenciaPago, 2),
    padNumeric(d.medioPago, 2),
    padNumeric(d.numeroOperacion ?? "", 6),
    padNumeric(d.numeroAutorizacion ?? "", 6),
    padNumeric("", 3), // entidad financiera debitada no usado
    padNumeric("0", 4), // sucursal (PlacetoPay reporta 0000)
    padNumeric(String(d.secuencia ?? 2), 7),
    padAlpha(d.causalDevolucion ?? "", 3),
    padAlpha("", 65)
  ];
  const line = parts.join("");
  if (line.length !== 162) throw new Error(`Collection detail length invalid: ${line.length}`);
  return line;
}

function buildCollectionBatchControl(batch: CollectionBatch, idx: number) {
  const totalReg = batch.details.length + 2;
  const valorTotal = batch.details.reduce((acc, d) => acc + d.valorRecaudado, 0);
  const parts = [
    "08",
    padNumeric(String(totalReg), 9),
    formatAmount(valorTotal, 18, 2),
    padNumeric(String(idx + 1), 4),
    padAlpha("", 129)
  ];
  const line = parts.join("");
  if (line.length !== 162) throw new Error(`Collection batch control length invalid: ${line.length}`);
  return line;
}

function buildCollectionFileControl(file: CollectionFile) {
  const all = file.batches.flatMap((b) => b.details);
  const total = all.length;
  const valorTotal = all.reduce((acc, d) => acc + d.valorRecaudado, 0);
  const parts = [
    "09",
    padNumeric(String(total), 9),
    formatAmount(valorTotal, 18, 2),
    padAlpha("", 133)
  ];
  const line = parts.join("");
  if (line.length !== 162) throw new Error(`Collection file control length invalid: ${line.length}`);
  return line;
}

export function buildCollectionFile(file: CollectionFile): string {
  const lines: string[] = [];
  lines.push(buildCollectionHeader(file.header));
  file.batches.forEach((batch, idx) => {
    lines.push(buildCollectionBatchHeader(batch.header));
    batch.details.forEach((d) => lines.push(buildCollectionDetail(d)));
    lines.push(buildCollectionBatchControl(batch, idx));
  });
  lines.push(buildCollectionFileControl(file));
  return lines.join("\n");
}
