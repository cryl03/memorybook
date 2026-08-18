import { albumService, fotoService } from '@core/api';
import { resolveFotosPorPagina, toEstiloDefault, toStoryId, toToneId } from './estilo';
import type { Album, AlbumEstilo, Foto, FotosPorPagina } from './types';

export interface SyncAlbumOptions {
  title: string;
  description?: string;
  photoUris: string[];
  story?: string;
  style?: string;
  estiloDefault?: AlbumEstilo | string;
  /** Diseño 1–4 → API `n_paginas` + upload `capacidad_fotos` */
  fotosPorPagina?: FotosPorPagina | number;
  onProgress?: (step: string, progress: number) => void;
}

export interface SyncAlbumResult {
  album: Album;
  uploadedCount: number;
  remoteFotos: Record<string, string>;
  pdfUrl?: string;
}

/** Prevent parallel creates (React Strict Mode / re-entrant effects) */
let createAlbumLock: Promise<SyncAlbumResult> | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForAlbumFotos(
  albumId: string,
  expected: number,
): Promise<Foto[]> {
  let last: Foto[] = [];
  for (let attempt = 0; attempt < 6; attempt += 1) {
    if (attempt > 0) await sleep(400 * attempt);
    last = await fotoService.listAlbumFotos(albumId);
    if (last.length === 0) {
      last = await fotoService.searchAlbumFotos(albumId).catch(() => []);
    }
    console.log('[FOTOS] GET list/busqueda', {
      attempt: attempt + 1,
      got: last.length,
      expected,
    });
    if (last.length >= expected) return last;
    if (last.length > 0 && attempt >= 2) return last;
  }
  return last;
}

export async function syncAlbumToApi({
  title,
  description,
  photoUris,
  story,
  style,
  estiloDefault,
  fotosPorPagina,
  onProgress,
}: SyncAlbumOptions): Promise<SyncAlbumResult> {
  if (createAlbumLock) {
    return createAlbumLock;
  }

  createAlbumLock = (async () => {
    onProgress?.('Creando álbum', 0.1);

    const estilo =
      estiloDefault ??
      (story || style ? toEstiloDefault(story ?? '', style ?? 'sutil') : undefined);

    // API `n_paginas` = Diseño 1–4 (NOT page count)
    const diseno = resolveFotosPorPagina({ fotosPorPagina });

    const album = await albumService.createAlbum({
      nombre: title,
      descripcion: description ?? null,
      ...(estilo ? { estilo_default: estilo } : {}),
      n_paginas: diseno,
    });

    if (!album.unique_id) {
      throw new Error('El álbum se creó sin identificador');
    }

    console.log('[FOTOS] album created', {
      unique_id: album.unique_id,
      photoUris: photoUris.length,
      sample: photoUris[0]?.slice(0, 96),
    });

    const retrieved = await albumService.retrieveAlbum(album.unique_id).catch(error => {
      console.warn('[FOTOS] retrieve after create failed', error);
      return album;
    });
    const albumId = retrieved.unique_id ?? album.unique_id;

    if (story || style) {
      try {
        await albumService.submitStyleSelector({
          album_id: albumId,
          story_id: toStoryId(story ?? ''),
          tone_id: toToneId(style ?? 'sutil'),
        });
      } catch (error) {
        console.warn('style-selector POST failed', error);
      }
    }

    if (photoUris.length === 0) {
      console.warn('[FOTOS] 0 URIs — PDF va a fallar (álbum sin páginas)');
      throw new Error('No hay fotos para subir. Vuelve a seleccionarlas.');
    }

    onProgress?.('Subiendo fotos', 0.2);

    const fotos = await fotoService.uploadFotos(
      albumId,
      photoUris,
      (uploaded: number, total: number) => {
        const uploadProgress = 0.2 + (uploaded / total) * 0.65;
        onProgress?.(`Subiendo fotos (${uploaded}/${total})`, uploadProgress);
      },
      { capacidadFotos: diseno },
    );

    let listed = fotos;
    try {
      const fromApi = await fotoService.listAlbumFotos(albumId);
      console.log('[FOTOS] GET list', {
        got: fromApi.length,
        expected: photoUris.length,
      });
      if (fromApi.length > 0) {
        listed = fromApi;
      } else {
        const searched = await fotoService.searchAlbumFotos(albumId).catch(() => []);
        console.log('[FOTOS] GET busqueda', { got: searched.length });
        if (searched.length > 0) listed = searched;
        else listed = await waitForAlbumFotos(albumId, photoUris.length);
      }
    } catch (error) {
      console.warn('[FOTOS] list verify failed', error);
    }

    console.log('[FOTOS] on album', {
      uploaded: fotos.length,
      listed: listed.length,
      expected: photoUris.length,
    });

    if (listed.length === 0 && fotos.length === 0) {
      throw new Error('Las fotos no se subieron al álbum');
    }

    onProgress?.('Generando álbum', 0.88);
    const pdf = await albumService.generateAlbumPdf(albumId);
    const pdfUrl = pdf.uri;

    onProgress?.('Álbum listo', 1);

    const uploaded = listed.length > fotos.length ? listed : fotos;

    const remoteFotos: Record<string, string> = {};
    uploaded.forEach((foto, index) => {
      const localUri = photoUris[index];
      if (localUri && foto.unique_id) {
        remoteFotos[localUri] = foto.unique_id;
      }
    });

    return {
      album: { ...album, ...retrieved, unique_id: albumId },
      uploadedCount: uploaded.length,
      remoteFotos,
      pdfUrl,
    };
  })().finally(() => {
    createAlbumLock = null;
  });

  return createAlbumLock;
}
