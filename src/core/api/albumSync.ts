import { albumService, fotoService } from '@core/api';
import { resolveFotosPorPagina, toEstiloDefault } from './estilo';
import type { AlbumEstilo, FotosPorPagina, UpdateAlbumPayload } from './types';

export async function syncAlbumMetadata(
  remoteId: string,
  title: string,
  story?: string,
  extra?: {
    style?: string;
    estiloDefault?: AlbumEstilo | string;
    /** Diseño 1–4 → API `n_paginas` */
    fotosPorPagina?: FotosPorPagina | number;
    onboardingStory?: string;
  },
): Promise<void> {
  const payload: UpdateAlbumPayload = {
    nombre: title,
    descripcion: story ?? null,
  };

  if (extra?.estiloDefault) {
    payload.estilo_default = extra.estiloDefault;
  } else if (extra?.onboardingStory || extra?.style) {
    payload.estilo_default = toEstiloDefault(
      extra.onboardingStory ?? '',
      extra.style ?? 'sutil',
    );
  }

  if (extra?.fotosPorPagina != null) {
    // API `n_paginas` = Diseño 1–4 (NOT page count)
    payload.n_paginas = resolveFotosPorPagina({
      fotosPorPagina: extra.fotosPorPagina,
    });
  }

  await albumService.patchAlbum(remoteId, payload);
}

export async function generateAlbumPdf(remoteId: string): Promise<void> {
  await albumService.generateAlbumPdf(remoteId);
}

export async function uploadMissingPhotos(
  remoteId: string,
  photoUris: string[],
  remoteFotos: Record<string, string> = {},
  onProgress?: (step: string, progress: number) => void,
  capacidadFotos?: FotosPorPagina | number,
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
    { capacidadFotos },
  );
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
  style?: string;
  onboardingStory?: string;
  estiloDefault?: AlbumEstilo | string;
  /** Diseño 1–4 */
  fotosPorPagina?: FotosPorPagina | number;
  onProgress?: (step: string, progress: number) => void;
}): Promise<{ remoteFotos: Record<string, string>; pdfUrl?: string }> {
  options.onProgress?.('Actualizando álbum', 0.05);
  await syncAlbumMetadata(options.remoteId, options.title, options.story, {
    style: options.style,
    onboardingStory: options.onboardingStory,
    estiloDefault: options.estiloDefault,
    fotosPorPagina: options.fotosPorPagina,
  });

  const previous = options.remoteFotos ?? {};
  const missing = options.photoUris.filter(uri => !previous[uri]);
  const remoteFotos = await uploadMissingPhotos(
    options.remoteId,
    options.photoUris,
    previous,
    options.onProgress,
    options.fotosPorPagina,
  );

  let pdfUrl: string | undefined;
  if (missing.length > 0) {
    options.onProgress?.('Generando álbum', 0.9);
    const pdf = await albumService.generateAlbumPdf(options.remoteId);
    pdfUrl = pdf.uri;
  }

  options.onProgress?.('Álbum listo', 1);
  return { remoteFotos, pdfUrl };
}
