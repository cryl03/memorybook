import type { AppDispatch } from '@core/store';
import { resolvePackageCapacity, pagesForPhotoCount } from '@core/store/albumUtils';
import { loadFromRemote } from '@core/store/slices/albumSlice';
import {
  loadAlbumPages,
  saveAlbumPages,
  saveAlbumTitle,
  loadCoverText,
  saveCoverText,
} from '@features/editor/storage';
import { redistributePagesWithDesign, ensureAllPhotosOnPages } from '@features/editor/utils';
import type { LayoutType, PageData } from '@features/editor/types';
import { fromEstiloDefault } from './estilo';
import { resolvePageOrientation } from './pageOrientation';
import { albumIdsEqual } from './albumId';
import { extractPdfUrl, resolveMediaUrl } from './pdfUrl';
import { clearCachedPdf } from './pdfCache';
import { albumService } from './services/albumService';
import { fotoService } from './services/fotoService';
import type { Album, Foto } from './types';

function resolveFotosPorPaginaValue(
  value: Album['n_paginas'],
): number {
  if (typeof value === 'number' && value >= 1 && value <= 4) return value;
  return 1;
}

async function loadFotosForAlbum(
  albumId: string,
  embedded?: Foto[],
): Promise<Foto[]> {
  if (embedded && embedded.length > 0) return embedded;

  try {
    const nested = await fotoService.listAlbumFotos(albumId);
    if (nested.length > 0) return nested;
  } catch {
    // sandbox nested route often 404s — fall through
  }

  const all = await fotoService.listFotos();
  return all.filter(foto => {
    const albumRef =
      typeof foto.album === 'object' && foto.album
        ? foto.album.unique_id
        : typeof foto.album === 'string'
          ? foto.album
          : foto.album_id;
    return albumIdsEqual(albumRef, albumId);
  });
}

export async function loadRemoteAlbumForEditor(
  albumId: string,
  dispatch: AppDispatch,
  albumSnapshot?: Album | null,
): Promise<void> {
  // Prefer list snapshot — sandbox `retrieve` is broken (UUID routing)
  const album =
    albumSnapshot && albumIdsEqual(albumSnapshot.unique_id, albumId)
      ? albumSnapshot
      : await albumService.getAlbum(albumId);

  const fotos = await loadFotosForAlbum(albumId, album.fotos);
  const photoUris = fotos
    .map(foto => foto.imagen)
    .filter((uri): uri is string => Boolean(uri));

  const remoteFotos: Record<string, string> = {};
  fotos.forEach(foto => {
    if (foto.imagen && foto.unique_id) {
      remoteFotos[foto.imagen] = foto.unique_id;
    }
  });

  const pageCount = pagesForPhotoCount(photoUris.length);
  const maxPhotos = resolvePackageCapacity(photoUris.length);
  const { story: estiloStory, style } = fromEstiloDefault(
    typeof album.estilo_default === 'string' ? album.estilo_default : null,
  );
  // API `n_paginas` = Diseño 1–4 (NOT page count)
  const fotosPorPagina = resolveFotosPorPaginaValue(album.n_paginas);
  const pageOrientation = await resolvePageOrientation({
    estiloDefault:
      typeof album.estilo_default === 'string' ? album.estilo_default : null,
    story: estiloStory,
    style,
  });

  const savedCoverText =
    (await loadCoverText(albumId)) ||
    (await loadCoverText(album.unique_id || '')) ||
    (await loadCoverText('local')) ||
    (album.descripcion ?? '').trim() ||
    '';

  const coverPage: PageData = {
    id: 'page-cover',
    photos: [],
    layout: 'single' as LayoutType,
    text: {
      content: savedCoverText,
      fontSize: 14,
      alignment: 'center',
    },
    stickers: [],
  };

  const savedPages = await loadAlbumPages(album.unique_id || albumId);
  const distributed = savedPages?.length
    ? ensureAllPhotosOnPages(savedPages, photoUris)
    : redistributePagesWithDesign(
        [],
        photoUris,
        fotosPorPagina,
      ).filter(p => p.id !== 'page-cover');

  const pages = savedPages?.length
    ? distributed
    : [coverPage, ...distributed.filter(p => p.id !== 'page-cover')];

  await saveAlbumPages(pages, album.unique_id || albumId);
  await saveAlbumTitle(album.nombre);
  if (savedCoverText) {
    const key = album.unique_id || albumId;
    await saveCoverText(key, savedCoverText);
    await saveCoverText('local', savedCoverText);
  }

  dispatch(
    loadFromRemote({
      title: album.nombre,
      photoCount: maxPhotos,
      maxPhotos,
      pageCount: Math.max(pageCount, distributed.length),
      photos: photoUris,
      style,
      story: estiloStory || album.descripcion || '',
      coverText: savedCoverText,
      fotosPorPagina,
      remoteId: album.unique_id ?? albumId,
      remoteFotos,
      pdfUrl: album.pdf
        ? resolveMediaUrl(album.pdf)
        : extractPdfUrl(album) ?? undefined,
      pageOrientation,
    }),
  );
}

/** Open cloud album on Wow (backend PDF). Does not hydrate the local editor. */
export async function openRemoteAlbumForPreview(
  albumId: string,
  dispatch: AppDispatch,
  albumSnapshot?: Album | null,
): Promise<void> {
  const album =
    albumSnapshot && albumIdsEqual(albumSnapshot.unique_id, albumId)
      ? albumSnapshot
      : await albumService.getAlbum(albumId);

  const remoteId = album.unique_id ?? albumId;
  const fotos = await loadFotosForAlbum(albumId, album.fotos);
  const photoUris = fotos
    .map(foto => (foto.imagen ? resolveMediaUrl(foto.imagen) : null))
    .filter((uri): uri is string => Boolean(uri));

  const remoteFotos: Record<string, string> = {};
  fotos.forEach(foto => {
    if (foto.imagen && foto.unique_id) {
      remoteFotos[resolveMediaUrl(foto.imagen)] = foto.unique_id;
    }
  });

  const { story: estiloStory, style } = fromEstiloDefault(
    typeof album.estilo_default === 'string' ? album.estilo_default : null,
  );
  const fotosPorPagina = resolveFotosPorPaginaValue(album.n_paginas);
  const pageOrientation = await resolvePageOrientation({
    estiloDefault:
      typeof album.estilo_default === 'string' ? album.estilo_default : null,
    story: estiloStory,
    style,
  });
  const pageCount =
    typeof album.paginas_total === 'number' && album.paginas_total > 0
      ? album.paginas_total
      : pagesForPhotoCount(photoUris.length);

  clearCachedPdf(remoteId);

  dispatch(
    loadFromRemote({
      title: album.nombre || 'Mi álbum',
      photoCount: Math.max(photoUris.length, 1),
      maxPhotos: resolvePackageCapacity(photoUris.length),
      pageCount,
      photos: photoUris,
      style,
      story: estiloStory || album.descripcion || '',
      coverText: (album.descripcion ?? '').trim(),
      fotosPorPagina,
      remoteId,
      remoteFotos,
      pdfUrl: album.pdf
        ? resolveMediaUrl(album.pdf)
        : `preview:${remoteId}:${Date.now()}`,
      pageOrientation,
    }),
  );
}
