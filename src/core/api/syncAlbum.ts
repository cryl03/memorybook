import { albumService, fotoService } from '@core/api';
import type { Album } from '@core/api/types';

export interface SyncAlbumOptions {
  title: string;
  description?: string;
  photoUris: string[];
  onProgress?: (step: string, progress: number) => void;
}

export interface SyncAlbumResult {
  album: Album;
  uploadedCount: number;
  remoteFotos: Record<string, string>;
}

export async function syncAlbumToApi({
  title,
  description,
  photoUris,
  onProgress,
}: SyncAlbumOptions): Promise<SyncAlbumResult> {
  onProgress?.('Creando álbum', 0.1);

  const album = await albumService.createAlbum({
    nombre: title,
    descripcion: description ?? null,
  });

  if (!album.unique_id) {
    throw new Error('El álbum se creó sin identificador');
  }

  if (photoUris.length === 0) {
    onProgress?.('Álbum listo', 1);
    return { album, uploadedCount: 0, remoteFotos: {} };
  }

  onProgress?.('Subiendo fotos', 0.2);

  const fotos = await fotoService.uploadFotos(
    album.unique_id,
    photoUris,
    (uploaded: number, total: number) => {
      const uploadProgress = 0.2 + (uploaded / total) * 0.8;
      onProgress?.(`Subiendo fotos (${uploaded}/${total})`, uploadProgress);
    },
  );

  onProgress?.('Álbum listo', 1);

  const remoteFotos: Record<string, string> = {};
  fotos.forEach((foto, index) => {
    const localUri = photoUris[index];
    if (localUri && foto.unique_id) {
      remoteFotos[localUri] = foto.unique_id;
    }
  });

  return {
    album,
    uploadedCount: fotos.length,
    remoteFotos,
  };
}
