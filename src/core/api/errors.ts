export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function firstFieldError(data: Record<string, unknown>): string | null {
  const first = Object.values(data).find(
    value => Array.isArray(value) && value.length > 0,
  );
  if (Array.isArray(first) && typeof first[0] === 'string') {
    return first[0];
  }
  return null;
}

function messageFromHtml(html: string): string | null {
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
  if (!title) return null;
  const clean = title.replace(/\s+/g, ' ').trim();
  if (/page not found/i.test(clean)) {
    return 'Endpoint no encontrado en el servidor (404).';
  }
  if (/TypeError|Error/i.test(clean)) {
    return `Error del servidor: ${clean.slice(0, 120)}`;
  }
  return clean.slice(0, 160);
}

export function getErrorMessage(error: unknown, fallback = 'Ocurrió un error'): string {
  if (error instanceof ApiError) {
    if (typeof error.data === 'object' && error.data !== null) {
      const data = error.data as Record<string, unknown>;
      if (typeof data.detail === 'string' && data.detail.trim()) {
        if (/no album matches/i.test(data.detail)) {
          return 'Álbum no encontrado en el servidor. Revisa el ID (API sandbox).';
        }
        return data.detail;
      }
      const fieldError = firstFieldError(data);
      if (fieldError) return fieldError;
    }

    if (typeof error.data === 'string' && error.data.includes('<html')) {
      return messageFromHtml(error.data) ?? error.message;
    }

    if (error.status === 404) {
      return 'Recurso no encontrado (404). Posible bug de rutas/ID en API.';
    }
    if (error.status === 502 || error.status === 503) {
      return 'API no disponible (servidor caído o reiniciando). Reintenta en un momento.';
    }
    if (error.status >= 500) {
      return `Error del servidor (${error.status}).`;
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
