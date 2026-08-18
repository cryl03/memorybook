import { apiRequest, apiRequestPdf, getAuthToken } from '../client';
import { albumIdsEqual, normalizeAlbumId } from '../albumId';
import {
  albumPdfEndpoint,
  extractPdfUrl,
  resolveMediaUrl,
} from '../pdfUrl';
import { getCachedPdf, setCachedPdf, clearCachedPdf } from '../pdfCache';
import { API_BASE_URL } from '../config';
import { ApiError, getErrorMessage } from '../errors';
import type {
  Album,
  AlbumPagina,
  AlbumPdfResult,
  CreateAlbumPayload,
  PaginatedResponse,
  StyleSelectorResponse,
  SubmitStyleSelectorPayload,
  UpdateAlbumPayload,
} from '../types';

function albumPathId(id: string): string {
  return normalizeAlbumId(id);
}

export async function listAlbums(page = 1): Promise<PaginatedResponse<Album>> {
  // IMPORTANT: no trailing slash — `/album/paginado/` returns HTML 404 on sandbox
  return apiRequest<PaginatedResponse<Album>>(
    `/album/paginado?page=${page}`,
  );
}

/**
 * Prefer paginado (includes nested fotos) — sandbox `retrieve` UUID routing
 * often 404s. Fall back to retrieve only if not found in list.
 */
export async function getAlbum(id: string): Promise<Album> {
  const fromList = await findAlbumInPaginado(id);
  if (fromList) return fromList;

  try {
    return await apiRequest<Album>(`/album/retrieve/${albumPathId(id)}`);
  } catch (retrieveError) {
    const undashed = id.replace(/-/g, '');
    if (undashed !== albumPathId(id)) {
      try {
        return await apiRequest<Album>(`/album/retrieve/${undashed}`);
      } catch {
        throw retrieveError;
      }
    }
    throw retrieveError;
  }
}

async function findAlbumInPaginado(id: string): Promise<Album | null> {
  let page = 1;
  for (;;) {
    const response = await listAlbums(page);
    const match = response.results.find(album =>
      albumIdsEqual(album.unique_id, id),
    );
    if (match) return match;

    if (!response.next || response.results.length === 0) return null;
    page += 1;
    if (page > 20) return null;
  }
}

export async function createAlbum(payload: CreateAlbumPayload): Promise<Album> {
  return apiRequest<Album>('/album/create', {
    method: 'POST',
    body: payload,
  });
}

export async function updateAlbum(
  id: string,
  payload: UpdateAlbumPayload,
): Promise<Album> {
  return apiRequest<Album>(`/album/update/${albumPathId(id)}`, {
    method: 'PUT',
    body: payload,
  });
}

export async function patchAlbum(
  id: string,
  payload: UpdateAlbumPayload,
): Promise<Album> {
  const dashed = albumPathId(id);
  const undashed = id.replace(/-/g, '');

  try {
    return await apiRequest<Album>(`/album/partial_update/${dashed}`, {
      method: 'PATCH',
      body: payload,
    });
  } catch (dashedError) {
    if (undashed === dashed) throw dashedError;

    try {
      return await apiRequest<Album>(`/album/partial_update/${undashed}`, {
        method: 'PATCH',
        body: payload,
      });
    } catch {
      throw dashedError;
    }
  }
}

export async function deleteAlbum(id: string): Promise<void> {
  const dashed = albumPathId(id);
  const undashed = id.replace(/-/g, '');

  try {
    await apiRequest<void>(`/album/delete/${dashed}`, { method: 'DELETE' });
  } catch (dashedError) {
    if (undashed === dashed) throw dashedError;
    await apiRequest<void>(`/album/delete/${undashed}`, { method: 'DELETE' });
  }
}

export async function getAlbumPagina(
  albumId: string,
  pagina: number,
): Promise<AlbumPagina> {
  const id = albumPathId(albumId);
  try {
    // Postman "pagina view": no trailing slash
    return await apiRequest<AlbumPagina>(`/album/${id}/paginas/${pagina}`);
  } catch (noSlashError) {
    try {
      return await apiRequest<AlbumPagina>(`/album/${id}/paginas/${pagina}/`);
    } catch {
      throw noSlashError;
    }
  }
}

export async function retrieveAlbum(id: string): Promise<Album> {
  const dashed = albumPathId(id);
  try {
    return await apiRequest<Album>(`/album/retrieve/${dashed}`);
  } catch (dashedError) {
    const undashed = id.replace(/-/g, '');
    if (undashed === dashed) throw dashedError;
    return apiRequest<Album>(`/album/retrieve/${undashed}`);
  }
}

/**
 * Postman "pagina view" — GET /album/:id/paginas/:n
 * Backend arma filas de página a partir de las fotos subidas.
 */
export async function viewAlbumPaginas(albumId: string): Promise<Album | null> {
  console.log('[PDF] pagina view 1', { albumId: albumPathId(albumId) });
  await getAlbumPagina(albumId, 1);

  const album = await retrieveAlbum(albumId).catch(error => {
    console.warn('[PDF] retrieve failed, paginado fallback', error);
    return getAlbum(albumId).catch(() => null);
  });

  console.log('[PDF] retrieve', {
    unique_id: album?.unique_id,
    paginas_total: album?.paginas_total,
    n_paginas: album?.n_paginas,
    fotos: album?.fotos?.length,
  });

  const total = album?.paginas_total;
  if (typeof total === 'number' && total > 1) {
    const last = Math.min(total, 80);
    for (let n = 2; n <= last; n += 1) {
      await getAlbumPagina(albumId, n).catch(error => {
        console.warn('[PDF] pagina view failed', n, getErrorMessage(error, ''));
      });
    }
  }

  return album;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isNoPagesToExport(error: unknown): boolean {
  return /no tiene paginas para exportar/i.test(getErrorMessage(error, ''));
}

function resultUri(
  response: Awaited<ReturnType<typeof apiRequestPdf>>,
  fallbackUri: string,
): string {
  const fromHeader = response.location
    ? resolveMediaUrl(response.location)
    : null;
  const fromJson = extractPdfUrl(response.json);
  if (fromJson) return resolveMediaUrl(fromJson);
  if (fromHeader && !/\/album\/[^/]+\/pdf\/?$/i.test(fromHeader)) {
    return fromHeader;
  }
  return fallbackUri;
}

/**
 * Postman fotos folder: pagina view → POST pdf.
 * GET /paginas arma páginas en servidor; POST /pdf/ las exporta.
 */
async function postAlbumPdf(
  albumId: string,
): Promise<{ uri: string; bytes: ArrayBuffer | null }> {
  const path = `/album/${albumPathId(albumId)}/pdf/`;
  const fallbackUri = albumPdfEndpoint(albumId);
  console.log('[PDF] POST', { albumId, path });

  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (attempt > 0) await sleep(1200 * attempt);
    await viewAlbumPaginas(albumId).catch(error => {
      console.warn('[PDF] pagina view failed', getErrorMessage(error, ''));
    });
    try {
      const response = await apiRequestPdf(path, { method: 'POST' });
      const bytes = await pdfBytesFromResponse(response);
      console.log('[PDF] POST ok', {
        attempt: attempt + 1,
        bytes: bytes?.byteLength ?? 0,
      });
      if (bytes) setCachedPdf(albumId, bytes);
      return { uri: resultUri(response, fallbackUri), bytes };
    } catch (error) {
      lastError = error;
      console.warn('[PDF] POST failed', {
        attempt: attempt + 1,
        message: getErrorMessage(error, String(error)),
        data: error instanceof ApiError ? error.data : undefined,
      });
      if (!isNoPagesToExport(error)) throw error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error('El servidor no devolvió el PDF del álbum');
}

export async function generateAlbumPdf(albumId: string): Promise<AlbumPdfResult> {
  clearCachedPdf(albumId);
  const { uri } = await postAlbumPdf(albumId);
  return { uri };
}

async function fetchUrlBytes(url: string): Promise<ArrayBuffer> {
  const headers = new Headers();
  const token = getAuthToken();
  if (
    token &&
    (url.startsWith(API_BASE_URL) || url.includes('sandboxmb.com'))
  ) {
    headers.set('Authorization', `Token ${token}`);
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new ApiError(`Request failed: ${response.status}`, response.status);
  }
  return response.arrayBuffer();
}

async function pdfBytesFromResponse(
  response: Awaited<ReturnType<typeof apiRequestPdf>>,
): Promise<ArrayBuffer | null> {
  if (response.bytes && response.bytes.byteLength > 4) {
    return response.bytes;
  }
  const url = extractPdfUrl(response.json) ?? response.location ?? null;
  if (!url) return null;
  const resolved = resolveMediaUrl(url);
  // POST-only API route — never GET /album/:id/pdf/
  if (/\/album\/[^/]+\/pdf\/?$/i.test(resolved)) {
    return null;
  }
  return fetchUrlBytes(resolved);
}

/** POST /album/:id/pdf/ — collection has no GET on this route. */
export async function fetchAlbumPdfBytes(albumId: string): Promise<ArrayBuffer> {
  const cached = getCachedPdf(albumId);
  if (cached && cached.byteLength > 4) {
    console.log('[PDF] cache hit', { albumId, bytes: cached.byteLength });
    return cached;
  }

  const { bytes } = await postAlbumPdf(albumId);
  if (bytes) return bytes;
  throw new Error('El servidor no devolvió el PDF del álbum');
}

export async function getStyleSelector(): Promise<StyleSelectorResponse> {
  return apiRequest<StyleSelectorResponse>('/album/style-selector');
}

export async function submitStyleSelector(
  payload: SubmitStyleSelectorPayload,
): Promise<unknown> {
  const formData = new FormData();
  formData.append('album_id', payload.album_id);
  formData.append('story_id', payload.story_id);
  formData.append('tone_id', payload.tone_id);

  return apiRequest<unknown>('/album/style-selector', {
    method: 'POST',
    body: formData,
  });
}

export const albumService = {
  listAlbums,
  getAlbum,
  retrieveAlbum,
  createAlbum,
  updateAlbum,
  patchAlbum,
  deleteAlbum,
  getAlbumPagina,
  viewAlbumPaginas,
  generateAlbumPdf,
  fetchAlbumPdfBytes,
  getStyleSelector,
  submitStyleSelector,
};
