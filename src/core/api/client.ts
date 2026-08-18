import { API_BASE_URL } from './config';
import { ApiError } from './errors';

type TokenGetter = () => string | null;

let tokenGetter: TokenGetter = () => null;

export function setTokenGetter(getter: TokenGetter): void {
  tokenGetter = getter;
}

export function getAuthToken(): string | null {
  return tokenGetter();
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  auth?: boolean;
}

/** RN/Hermes: `instanceof FormData` can be false for a real FormData. */
function isFormDataBody(body: unknown): body is FormData {
  if (body == null || typeof body !== 'object') return false;
  if (typeof FormData !== 'undefined' && body instanceof FormData) return true;
  if (Object.prototype.toString.call(body) === '[object FormData]') return true;
  return (body as { constructor?: { name?: string } }).constructor?.name === 'FormData';
}

function buildHeaders(
  options: RequestOptions,
): { requestHeaders: Headers; rest: Omit<RequestInit, 'body' | 'headers'> } {
  const { body, auth = true, headers, ...rest } = options;
  const requestHeaders = new Headers(headers);

  // Multipart must NOT set Content-Type — fetch adds boundary
  if (body !== undefined && !isFormDataBody(body)) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (auth) {
    const token = tokenGetter();
    if (token) {
      requestHeaders.set('Authorization', `Token ${token}`);
    }
  }

  return { requestHeaders, rest };
}

function encodeBody(body: unknown): RequestInit['body'] {
  if (body === undefined) return undefined;
  if (isFormDataBody(body)) return body;
  return JSON.stringify(body);
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

function parseXhrBody(xhr: XMLHttpRequest): unknown {
  const contentType = xhr.getResponseHeader('content-type') ?? '';
  const text = xhr.responseText ?? '';

  if (xhr.status === 204 || text.length === 0) return null;

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  return text;
}

/**
 * RN fetch + `Headers` often drops file parts from FormData.
 * XHR sends multipart with boundary intact (same as Postman).
 */
function apiRequestFormData<T>(
  path: string,
  options: RequestOptions,
): Promise<T> {
  const method = (options.method as string | undefined) ?? 'POST';
  const url = `${API_BASE_URL}${path}`;
  const auth = options.auth !== false;
  const token = auth ? tokenGetter() : null;

  console.log('[API] FormData XHR', { method, path });

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    if (token) {
      xhr.setRequestHeader('Authorization', `Token ${token}`);
    }

    xhr.onload = () => {
      const data = parseXhrBody(xhr);
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data as T);
        return;
      }
      reject(
        new ApiError(`Request failed: ${xhr.status}`, xhr.status, data),
      );
    };
    xhr.onerror = () => {
      reject(new Error('No se pudo subir el archivo (red)'));
    };
    xhr.send(options.body as FormData);
  });
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  if (isFormDataBody(options.body)) {
    return apiRequestFormData<T>(path, options);
  }

  const { requestHeaders, rest } = buildHeaders(options);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
    body: encodeBody(options.body),
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

export interface PdfResponse {
  contentType: string;
  json?: unknown;
  bytes?: ArrayBuffer;
  location?: string | null;
}

function bytesToText(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes);
  let out = '';
  const chunk = 0x8000;
  for (let i = 0; i < view.length; i += chunk) {
    out += String.fromCharCode(...view.subarray(i, i + chunk));
  }
  return out;
}

function isPdfMagic(bytes: ArrayBuffer): boolean {
  if (bytes.byteLength < 5) return false;
  const head = new Uint8Array(bytes, 0, 5);
  return (
    head[0] === 0x25 &&
    head[1] === 0x50 &&
    head[2] === 0x44 &&
    head[3] === 0x46 &&
    head[4] === 0x2d
  ); // %PDF-
}

/** POST/GET that may return JSON (url) or raw `application/pdf`. */
export async function apiRequestPdf(
  path: string,
  options: RequestOptions = {},
): Promise<PdfResponse> {
  const { body } = options;
  const { requestHeaders, rest } = buildHeaders(options);
  requestHeaders.set('Accept', 'application/pdf, application/json');

  const url = `${API_BASE_URL}${path}`;
  const method = (rest.method as string | undefined) ?? 'GET';
  console.log('[PDF] request', { method, url, path });

  const response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
    body: encodeBody(body),
  });

  const contentType = response.headers.get('content-type') ?? '';
  const location =
    response.headers.get('location') ??
    response.headers.get('content-location');

  const bytes = await response.arrayBuffer();

  console.log('[PDF] response', {
    method,
    url,
    status: response.status,
    ok: response.ok,
    contentType,
    location,
    bytes: bytes.byteLength,
    isPdf: isPdfMagic(bytes),
  });

  if (!response.ok) {
    let data: unknown = null;
    try {
      data = JSON.parse(bytesToText(bytes));
    } catch {
      data = bytesToText(bytes).slice(0, 400);
    }
    console.warn('[PDF] error body', data);
    throw new ApiError(
      `Request failed: ${response.status}`,
      response.status,
      data,
    );
  }

  if (
    contentType.includes('application/pdf') ||
    contentType.includes('octet-stream') ||
    isPdfMagic(bytes)
  ) {
    console.log('[PDF] got binary PDF', { bytes: bytes.byteLength });
    return { contentType, bytes, location };
  }

  let json: unknown = null;
  try {
    json = JSON.parse(bytesToText(bytes));
  } catch {
    json = null;
  }

  console.log('[PDF] got JSON', json);
  return { contentType, json, location };
}
