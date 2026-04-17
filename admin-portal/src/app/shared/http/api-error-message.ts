import { HttpErrorResponse } from '@angular/common/http';

type ApiEnvelope = { error?: { message?: string; code?: string }; message?: string };

/**
 * Mensaje legible para operadores no técnicos (FR-030).
 * Prioriza `error.message` del API; evita mostrar solo códigos HTTP.
 */
export function messageFromApiError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as ApiEnvelope | null | undefined;
    const fromApi = body?.error?.message ?? (typeof body?.message === 'string' ? body.message : null);
    if (fromApi) return fromApi;
    if (err.status === 0) {
      return 'No se pudo conectar con el servidor. Verificá tu conexión o el proxy hacia la API.';
    }
    return `No se pudo completar la operación (código ${err.status}). Intentá de nuevo o contactá a soporte.`;
  }
  if (err instanceof Error) return err.message;
  return 'Ocurrió un error inesperado.';
}
