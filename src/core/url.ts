import { PlacetoPayValidationError } from "../errors/errors";

/**
 * Construye una return/cancel URL desde base + path + params.
 * Ideal para evitar hardcodeo disperso en el código del usuario.
 */
export function buildReturnUrl(
  base: string,
  path: string,
  params?: Record<string, string | number>
) {
  if (!base) throw new PlacetoPayValidationError("returnUrl base is required");
  if (!path) throw new PlacetoPayValidationError("returnUrl path is required");

  const url = new URL(path, base);

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }
  }

  return url.toString();
}

/**
 * Valida una URL y tira error legible si no es válida.
 */
export function assertValidUrl(value: string, fieldName = "url") {
  try {
    new URL(value);
    return true;
  } catch {
    throw new PlacetoPayValidationError(`${fieldName} must be a valid URL`);
  }
}
