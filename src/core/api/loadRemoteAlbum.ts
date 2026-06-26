import type { AppDispatch } from '@core/store';
import { loadFromRemote } from '@core/store/slices/albumSlice';
import {
  clearAlbumStorage,
  saveAlbumPages,
  saveAlbumTitle,
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

  const pageCount = Math.max(1, Math.ceil(photoUris.length / 3));

  const coverPage: PageData = {
    id: 'page-cover',
    photos: [],
    layout: 'single' as LayoutType,
    text: { content: '', fontSize: 14, alignment: 'center' },
    stickers: [],
  };

  const distributed = distributePhotosToPages(photoUris, pageCount);

  await clearAlbumStorage();
  await saveAlbumPages([coverPage, ...distributed]);
  await saveAlbumTitle(album.nombre);

  dispatch(
    loadFromRemote({
      title: album.nombre,
      photoCount: photoUris.length,
      pageCount,
      photos: photoUris,
      style: '',
      story: album.descripcion ?? '',
      remoteId: album.unique_id ?? albumId,
      remoteFotos,
    }),
  );
}
