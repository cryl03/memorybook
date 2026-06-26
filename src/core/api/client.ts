import { API_BASE_URL } from './config';
import { ApiError } from './errors';

type TokenGetter = () => string | null;

let tokenGetter: TokenGetter = () => null;

export function setTokenGetter(getter: TokenGetter): void {
  tokenGetter = getter;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  auth?: boolean;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  return text.length > 0 ? text : null;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, auth = true, headers, ...rest } = options;

  const requestHeaders = new Headers(headers);

  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (auth) {
    const token = tokenGetter();
    if (token) {
      requestHeaders.set('Authorization', `Token ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });

  const data = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiError(
      `Request failed: ${response.status}`,
      response.status,
      data,
    );
  }

  return data as T;
}
