import { apiRequest } from '../client';
import type { Foto, UploadFotoPayload } from '../types';

function buildFotoFormData(payload: UploadFotoPayload): FormData {
  const formData = new FormData();
  const fileName = payload.fileName ?? `photo-${Date.now()}.jpg`;
  const mimeType = payload.mimeType ?? 'image/jpeg';

  formData.append('album_id', payload.album_id);
  formData.append('imagen', {
    uri: payload.uri,
    type: mimeType,
    name: fileName,
  } as unknown as Blob);

  if (payload.descripcion) {
    formData.append('descripcion', payload.descripcion);
  }

  return formData;
}

export async function listFotos(): Promise<Foto[]> {
  return apiRequest<Foto[]>('/fotos/');
}

export async function listAlbumFotos(albumId: string): Promise<Foto[]> {
  return apiRequest<Foto[]>(`/album/${albumId}/fotos/`);
}

export async function getFoto(fotoId: string): Promise<Foto> {
  return apiRequest<Foto>(`/fotos/${fotoId}/`);
}

export async function uploadFoto(payload: UploadFotoPayload): Promise<Foto> {
  return apiRequest<Foto>('/fotos/', {
    method: 'POST',
    body: buildFotoFormData(payload),
  });
}

export async function uploadAlbumFoto(payload: UploadFotoPayload): Promise<Foto> {
  return apiRequest<Foto>(`/album/${payload.album_id}/fotos/`, {
    method: 'POST',
    body: buildFotoFormData(payload),
  });
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

export async function uploadFotos(
  albumId: string,
  photoUris: string[],
  onProgress?: (uploaded: number, total: number) => void,
): Promise<Foto[]> {
  const uploaded: Foto[] = [];

  for (let index = 0; index < photoUris.length; index += 1) {
    const foto = await uploadFoto({
      album_id: albumId,
      uri: photoUris[index],
      fileName: `photo-${index + 1}.jpg`,
    });
    uploaded.push(foto);
    onProgress?.(index + 1, photoUris.length);
  }

  return uploaded;
}

export const fotoService = {
  listFotos,
  listAlbumFotos,
  getFoto,
  uploadFoto,
  uploadAlbumFoto,
  updateFoto,
  patchFoto,
  deleteFoto,
  uploadFotos,
};
