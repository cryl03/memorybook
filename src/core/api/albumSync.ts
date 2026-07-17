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
  onProgress?: (step: string, progress: number) => void,
): Promise<Record<string, string>> {
  const missingUris = photoUris.filter(uri => !remoteFotos[uri]);
  if (missingUris.length === 0) return remoteFotos;

  onProgress?.('Subiendo fotos', 0.15);

  const uploaded = await fotoService.uploadFotos(
    remoteId,
    missingUris,
    (uploadedCount, total) => {
      const uploadProgress = 0.15 + (uploadedCount / total) * 0.85;
      onProgress?.(`Subiendo fotos (${uploadedCount}/${total})`, uploadProgress);
    },
  );
  const updated = { ...remoteFotos };

  uploaded.forEach((foto, index) => {
    const localUri = missingUris[index];
    if (localUri && foto.unique_id) {
      updated[localUri] = foto.unique_id;
    }
  });

  onProgress?.('Álbum listo', 1);

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
  onProgress?: (step: string, progress: number) => void;
}): Promise<Record<string, string>> {
  options.onProgress?.('Actualizando álbum', 0.05);
  await syncAlbumMetadata(options.remoteId, options.title, options.story);
  return uploadMissingPhotos(
    options.remoteId,
    options.photoUris,
    options.remoteFotos ?? {},
    options.onProgress,
  );
}
