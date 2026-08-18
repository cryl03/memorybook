import { apiRequest } from '../client';
import { normalizeAlbumId } from '../albumId';
import { toFotosPorPagina } from '../estilo';
import type { Foto, FotosPorPagina, UploadFotoPayload } from '../types';

export type UploadFotosOptions = {
  descripcion?: string | null;
  /** Diseño 1–4 (API field `capacidad_fotos`) */
  capacidadFotos?: FotosPorPagina | number | null;
};

/** Postman create uses 3 files per POST. */
const UPLOAD_CHUNK_SIZE = 3;

function fileMeta(uri: string, index: number): { fileName: string; mimeType: string } {
  const path = uri.split('?')[0] ?? uri;
  const extMatch = /\.([a-zA-Z0-9]+)$/.exec(path);
  const ext = (extMatch?.[1] ?? 'jpg').toLowerCase();
  const mimeType =
    ext === 'png'
      ? 'image/png'
      : ext === 'gif'
        ? 'image/gif'
        : ext === 'webp'
          ? 'image/webp'
          : ext === 'heic' || ext === 'heif'
            ? 'image/heic'
            : 'image/jpeg';
  const suffix = ext === 'jpeg' ? 'jpg' : ext === 'heif' ? 'heic' : ext;
  return { fileName: `photo-${index + 1}.${suffix}`, mimeType };
}

function uploadUri(uri: string): string {
  if (uri.startsWith('/') && !uri.startsWith('file://')) {
    return `file://${uri}`;
  }
  return uri;
}

function filePart(
  uri: string,
  fileName: string,
  mimeType: string,
): Blob {
  return {
    uri: uploadUri(uri),
    type: mimeType,
    name: fileName,
  } as unknown as Blob;
}

/**
 * Postman: `imagen` (1 file) or `imagenes` (lote).
 * `capacidad_fotos` = diseño 1–4 — backend asigna fotos a páginas.
 */
function buildAlbumFotosFormData(
  photoUris: string[],
  options?: UploadFotosOptions,
): FormData {
  const formData = new FormData();
  const field = photoUris.length === 1 ? 'imagen' : 'imagenes';

  photoUris.forEach((uri, index) => {
    const meta = fileMeta(uri, index);
    formData.append(field, filePart(uri, meta.fileName, meta.mimeType));
  });

  if (options?.descripcion) {
    formData.append('descripcion', options.descripcion);
  }

  formData.append(
    'capacidad_fotos',
    String(toFotosPorPagina(options?.capacidadFotos)),
  );

  return formData;
}

function buildFotoFormData(payload: UploadFotoPayload): FormData {
  const formData = new FormData();
  const fileName = payload.fileName ?? `photo-${Date.now()}.jpg`;
  const mimeType = payload.mimeType ?? 'image/jpeg';

  if (payload.album_id) {
    formData.append('album_id', payload.album_id);
  }

  formData.append('imagen', filePart(payload.uri, fileName, mimeType));

  if (payload.descripcion) {
    formData.append('descripcion', payload.descripcion);
  }

  if (payload.capacidad_fotos != null) {
    formData.append(
      'capacidad_fotos',
      String(toFotosPorPagina(payload.capacidad_fotos)),
    );
  }

  return formData;
}

function normalizeFotosResponse(data: unknown): Foto[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.results)) return obj.results as Foto[];
    if (Array.isArray(obj.fotos)) return obj.fotos as Foto[];
    if (obj.unique_id || obj.imagen) return [data as Foto];
  }
  return [];
}

function albumIdCandidates(albumId: string): string[] {
  const dashed = normalizeAlbumId(albumId);
  const undashed = albumId.replace(/-/g, '');
  return [...new Set([dashed, undashed, albumId].filter(Boolean))];
}

export async function listFotos(): Promise<Foto[]> {
  const data = await apiRequest<unknown>('/fotos/');
  return normalizeFotosResponse(data);
}

export async function listAlbumFotos(albumId: string): Promise<Foto[]> {
  const data = await apiRequest<unknown>(
    `/album/${normalizeAlbumId(albumId)}/fotos/`,
  );
  return normalizeFotosResponse(data);
}

export async function searchAlbumFotos(albumId: string): Promise<Foto[]> {
  const data = await apiRequest<unknown>(
    `/album/${normalizeAlbumId(albumId)}/fotos/busqueda/`,
  );
  return normalizeFotosResponse(data);
}

export async function getFoto(fotoId: string): Promise<Foto> {
  return apiRequest<Foto>(`/fotos/${fotoId}/`);
}

export async function uploadFoto(payload: UploadFotoPayload): Promise<Foto> {
  let lastError: unknown;

  for (const albumId of albumIdCandidates(payload.album_id)) {
    try {
      return await apiRequest<Foto>('/fotos/', {
        method: 'POST',
        body: buildFotoFormData({ ...payload, album_id: albumId }),
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

export async function uploadAlbumFoto(payload: UploadFotoPayload): Promise<Foto> {
  const [foto] = await uploadAlbumFotos(payload.album_id, [payload.uri], {
    descripcion: payload.descripcion,
    capacidadFotos: payload.capacidad_fotos,
  });
  return foto;
}

/** POST `/album/:id/fotos/` — `imagen`/`imagenes` + `capacidad_fotos`. */
export async function uploadAlbumFotos(
  albumId: string,
  photoUris: string[],
  options?: UploadFotosOptions,
): Promise<Foto[]> {
  if (photoUris.length === 0) return [];

  let lastError: unknown;

  for (const id of albumIdCandidates(albumId)) {
    try {
      console.log('[FOTOS] POST', {
        albumId: id,
        count: photoUris.length,
        sample: photoUris[0]?.slice(0, 96),
      });
      const data = await apiRequest<unknown>(`/album/${id}/fotos/`, {
        method: 'POST',
        body: buildAlbumFotosFormData(photoUris, options),
      });
      const fotos = normalizeFotosResponse(data);
      console.log('[FOTOS] POST ok', {
        sent: photoUris.length,
        got: fotos.length,
        ids: fotos.map(f => f.unique_id).filter(Boolean),
        asignada: fotos.map(f => f.asignada),
      });
      if (fotos.length === 0) {
        throw new Error('El servidor no devolvió fotos subidas');
      }
      return fotos;
    } catch (error) {
      lastError = error;
      console.warn('[FOTOS] POST failed', { albumId: id, error });
    }
  }

  throw lastError;
}

export async function updateFoto(
  fotoId: string,
  payload: Partial<Pick<Foto, 'descripcion' | 'album_id'>>,
): Promise<Foto> {
  return apiRequest<Foto>(`/fotos/${fotoId}/`, {
    method: 'PUT',
    body: payload,
  });
}

export async function patchFoto(
  fotoId: string,
  payload: Partial<Pick<Foto, 'descripcion' | 'album_id'>>,
): Promise<Foto> {
  return apiRequest<Foto>(`/fotos/${fotoId}/`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteFoto(fotoId: string): Promise<void> {
  await apiRequest<void>(`/fotos/${fotoId}/`, {
    method: 'DELETE',
  });
}

async function uploadChunkOneByOne(
  albumId: string,
  photoUris: string[],
  options?: UploadFotosOptions,
): Promise<Foto[]> {
  const uploaded: Foto[] = [];
  for (let index = 0; index < photoUris.length; index += 1) {
    const fotos = await uploadAlbumFotos(albumId, [photoUris[index]], options);
    uploaded.push(...fotos);
  }
  return uploaded;
}

/**
 * Nested `POST /album/:id/fotos/` in chunks of 3 (Postman).
 * Never `POST /fotos/` — that path leaves `asignada: false` and PDF vacío.
 */
export async function uploadFotos(
  albumId: string,
  photoUris: string[],
  onProgress?: (uploaded: number, total: number) => void,
  options?: UploadFotosOptions,
): Promise<Foto[]> {
  if (photoUris.length === 0) return [];

  console.log('[FOTOS] upload start', {
    albumId,
    count: photoUris.length,
    sample: photoUris[0]?.slice(0, 96),
  });

  const all: Foto[] = [];

  for (let i = 0; i < photoUris.length; i += UPLOAD_CHUNK_SIZE) {
    const chunk = photoUris.slice(i, i + UPLOAD_CHUNK_SIZE);
    try {
      const fotos = await uploadAlbumFotos(albumId, chunk, options);
      all.push(...fotos);
    } catch (error) {
      console.warn('[FOTOS] chunk failed, nested one-by-one', error);
      const fotos = await uploadChunkOneByOne(albumId, chunk, options);
      all.push(...fotos);
    }
    onProgress?.(Math.min(i + chunk.length, photoUris.length), photoUris.length);
  }

  const unassigned = all.filter(foto => foto.asignada === false).length;
  console.log('[FOTOS] upload done', {
    sent: photoUris.length,
    got: all.length,
    unassigned,
  });
  if (unassigned > 0) {
    console.warn('[FOTOS] algunas fotos quedaron sin asignar a páginas', unassigned);
  }
  return all;
}

/**
 * Upload photos in batches grouped by diseño (`capacidad_fotos`).
 * Enables: first N with design 1, next M with design 2, etc.
 */
export async function uploadFotosByCapacidad(
  albumId: string,
  batches: Array<{ photoUris: string[]; capacidadFotos: FotosPorPagina | number }>,
  onProgress?: (uploaded: number, total: number) => void,
): Promise<Foto[]> {
  const total = batches.reduce((sum, b) => sum + b.photoUris.length, 0);
  if (total === 0) return [];

  const all: Foto[] = [];
  let done = 0;

  for (const batch of batches) {
    if (batch.photoUris.length === 0) continue;
    const fotos = await uploadAlbumFotos(albumId, batch.photoUris, {
      capacidadFotos: batch.capacidadFotos,
    });
    all.push(...fotos);
    done += batch.photoUris.length;
    onProgress?.(done, total);
  }

  return all;
}

export const fotoService = {
  listFotos,
  listAlbumFotos,
  searchAlbumFotos,
  getFoto,
  uploadFoto,
  uploadAlbumFoto,
  uploadAlbumFotos,
  updateFoto,
  patchFoto,
  deleteFoto,
  uploadFotos,
  uploadFotosByCapacidad,
};
