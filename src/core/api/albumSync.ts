import { albumService, fotoService } from '@core/api';

export async function syncAlbumMetadata(
  remoteId: string,
  title: string,
  story?: string,
): Promise<void> {
  await albumService.patchAlbum(remoteId, {
    nombre: title,
    descripcion: story ?? null,
  });
}

export async function generateAlbumPdf(remoteId: string): Promise<void> {
  await albumService.generateAlbumPdf(remoteId);
}

export async function uploadMissingPhotos(
  remoteId: string,
  photoUris: string[],
  remoteFotos: Record<string, string> = {},
): Promise<Record<string, string>> {
  const missingUris = photoUris.filter(uri => !remoteFotos[uri]);
  if (missingUris.length === 0) return remoteFotos;

  const uploaded = await fotoService.uploadFotos(remoteId, missingUris);
  const updated = { ...remoteFotos };

  uploaded.forEach((foto, index) => {
    const localUri = missingUris[index];
    if (localUri && foto.unique_id) {
      updated[localUri] = foto.unique_id;
    }
  });

  return updated;
}

export async function deleteRemotePhoto(fotoId: string): Promise<void> {
  await fotoService.deleteFoto(fotoId);
}

export async function syncAlbumToCloud(options: {
  remoteId: string;
  title: string;
  story?: string;
  photoUris: string[];
  remoteFotos?: Record<string, string>;
}): Promise<Record<string, string>> {
  await syncAlbumMetadata(options.remoteId, options.title, options.story);
  return uploadMissingPhotos(
    options.remoteId,
    options.photoUris,
    options.remoteFotos ?? {},
  );
}
