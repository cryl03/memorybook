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

export function getErrorMessage(error: unknown, fallback = 'Ocurrió un error'): string {
  if (error instanceof ApiError) {
    if (typeof error.data === 'object' && error.data !== null) {
      const data = error.data as Record<string, unknown>;
      const firstFieldError = Object.values(data).find(
        value => Array.isArray(value) && value.length > 0,
      );
      if (Array.isArray(firstFieldError) && typeof firstFieldError[0] === 'string') {
        return firstFieldError[0];
      }
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
