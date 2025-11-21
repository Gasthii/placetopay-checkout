export type LightboxBackupTarget = "self" | "popup" | "blank";

export interface LightboxOptions {
  backupTarget?: LightboxBackupTarget;
  opacity?: number;
}

export interface LightboxEvents {
  response?: (resp: unknown) => void;
  close?: () => void;
}

/**
 * Inicializa el lightbox en frontend. Requiere que el script oficial esté cargado:
 * <script src="https://checkout.placetopay.com/lightbox.min.js"></script>
 */
/**
 * Inicializa el lightbox en frontend con typings detallados.
 *
 * @typedef {"self"|"popup"|"blank"} LightboxBackupTarget
 * @typedef {{ backupTarget?: LightboxBackupTarget, opacity?: number }} LightboxOptions
 * @typedef {{ response?: (resp: unknown) => void, close?: () => void }} LightboxEvents
 *
 * Requiere que el script oficial esté cargado:
 * `<script src="https://checkout.placetopay.com/lightbox.min.js"></script>`
 *
 * @param {string} processUrl URL devuelta por create/session o process.
 * @param {LightboxOptions} [options] Opciones documentadas (backupTarget, opacity).
 * @param {LightboxEvents} [events] Callbacks response/close.
 * @returns {any} Instancia P del lightbox para usos avanzados.
 */
export function initLightbox(processUrl: string, options?: LightboxOptions, events?: LightboxEvents) {
  if (typeof window === "undefined") {
    throw new Error("initLightbox solo debe usarse en el navegador");
  }
  const P = (window as any).P;
  if (!P || typeof P.init !== "function") {
    throw new Error("Lightbox script no cargado. Incluye https://checkout.placetopay.com/lightbox.min.js");
  }
  P.init(processUrl, options ?? {});
  if (events?.response) P.on("response", events.response);
  if (events?.close) P.on("close", events.close);
  return P;
}
