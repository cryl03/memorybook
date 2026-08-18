import { API_BASE_URL, API_UPLOADS_BASE_URL } from './config';
import { normalizeAlbumId } from './albumId';

const PDF_URL_KEYS = [
  'pdf',
  'pdf_url',
  'url',
  'archivo',
  'file',
  'path',
  'media',
] as const;

function firstStringUrl(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  if (value && typeof value === 'object') {
    const nested = value as Record<string, unknown>;
    if (typeof nested.url === 'string' && nested.url.trim()) {
      return nested.url.trim();
    }
    if (typeof nested.pdf === 'string' && nested.pdf.trim()) {
      return nested.pdf.trim();
    }
  }
  return null;
}

export function extractPdfUrl(data: unknown): string | null {
  if (!data) return null;
  const direct = firstStringUrl(data);
  if (direct && (direct.startsWith('http') || direct.startsWith('/') || direct.includes('.pdf'))) {
    return direct;
  }
  if (typeof data !== 'object') return null;

  const obj = data as Record<string, unknown>;
  for (const key of PDF_URL_KEYS) {
    const found = firstStringUrl(obj[key]);
    if (found) return found;
  }
  return null;
}

export function resolveMediaUrl(pathOrUrl: string): string {
  if (
    pathOrUrl.startsWith('http://') ||
    pathOrUrl.startsWith('https://') ||
    pathOrUrl.startsWith('data:')
  ) {
    return pathOrUrl;
  }
  if (pathOrUrl.startsWith('/')) {
    return `${API_UPLOADS_BASE_URL}${pathOrUrl}`;
  }
  return `${API_UPLOADS_BASE_URL}/${pathOrUrl}`;
}

export function albumPdfEndpoint(albumId: string): string {
  return `${API_BASE_URL}/album/${normalizeAlbumId(albumId)}/pdf/`;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  const btoaFn = (
    globalThis as unknown as { btoa?: (data: string) => string }
  ).btoa;
  if (!btoaFn) {
    throw new Error('btoa unavailable');
  }
  return btoaFn(binary);
}

export function pdfBytesToUri(bytes: ArrayBuffer): string | null {
  if (bytes.byteLength === 0) return null;
  return `data:application/pdf;base64,${arrayBufferToBase64(bytes)}`;
}
