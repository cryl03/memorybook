import type { AppDispatch } from '@core/store';
import { resolvePackageCapacity, pagesForPhotoCount } from '@core/store/albumUtils';
import { loadFromRemote } from '@core/store/slices/albumSlice';
import {
  clearAlbumStorage,
  saveAlbumPages,
  saveAlbumTitle,
  loadCoverText,
  saveCoverText,
} from '@features/editor/storage';
import { distributePhotosToPages } from '@features/editor/utils';
import type { LayoutType, PageData } from '@features/editor/types';
import { albumService } from './services/albumService';

export async function loadRemoteAlbumForEditor(
  albumId: string,
  dispatch: AppDispatch,
): Promise<void> {
  const album = await albumService.getAlbum(albumId);
  const photoUris = (album.fotos ?? [])
    .map(foto => foto.imagen)
    .filter((uri): uri is string => Boolean(uri));

  const remoteFotos: Record<string, string> = {};
  (album.fotos ?? []).forEach(foto => {
    if (foto.imagen && foto.unique_id) {
      remoteFotos[foto.imagen] = foto.unique_id;
    }
  });

  const pageCount = pagesForPhotoCount(photoUris.length);
  const maxPhotos = resolvePackageCapacity(photoUris.length);

  // Restore cover text: local storage first, then album.descripcion from API (web)
  const savedCoverText =
    (await loadCoverText(albumId)) ||
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

  const distributed = distributePhotosToPages(photoUris, pageCount);

  await clearAlbumStorage();
  await saveAlbumPages([coverPage, ...distributed]);
  await saveAlbumTitle(album.nombre);
  if (savedCoverText) {
    await saveCoverText(albumId, savedCoverText);
    await saveCoverText('local', savedCoverText);
  }

  dispatch(
    loadFromRemote({
      title: album.nombre,
      photoCount: maxPhotos,
      maxPhotos,
      pageCount,
      photos: photoUris,
      style: '',
      story: album.descripcion ?? '',
      coverText: savedCoverText,
      remoteId: album.unique_id ?? albumId,
      remoteFotos,
    }),
  );
}
