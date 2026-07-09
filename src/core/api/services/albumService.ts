import { apiRequest } from '../client';
import type {
  Album,
  CreateAlbumPayload,
  PaginatedResponse,
  UpdateAlbumPayload,
} from '../types';

export async function listAlbums(page = 1): Promise<PaginatedResponse<Album>> {
  return apiRequest<PaginatedResponse<Album>>(`/album/paginado?page=${page}`);
}

export async function getAlbum(id: string): Promise<Album> {
  return apiRequest<Album>(`/album/retrieve/${id}`);
}

export async function createAlbum(payload: CreateAlbumPayload): Promise<Album> {
  const formData = new FormData();
  formData.append('nombre', payload.nombre);

  if (payload.descripcion) {
    formData.append('descripcion', payload.descripcion);
  }

  return apiRequest<Album>('/album/create', {
    method: 'POST',
    body: formData,
  });
}

export async function updateAlbum(
  id: string,
  payload: UpdateAlbumPayload,
): Promise<Album> {
  return apiRequest<Album>(`/album/update/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

export async function patchAlbum(
  id: string,
  payload: UpdateAlbumPayload,
): Promise<Album> {
  return apiRequest<Album>(`/album/partial_update/${id}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteAlbum(id: string): Promise<void> {
  await apiRequest<void>(`/album/delete/${id}`, {
    method: 'DELETE',
  });
}

export async function generateAlbumPdf(albumId: string): Promise<unknown> {
  return apiRequest<unknown>(`/album/${albumId}/pdf/`, {
    method: 'POST',
  });
}

export const albumService = {
  listAlbums,
  getAlbum,
  createAlbum,
  updateAlbum,
  patchAlbum,
  deleteAlbum,
  generateAlbumPdf,
};
