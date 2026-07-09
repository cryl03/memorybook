import type { AlbumState } from './slices/albumSlice';

type Album = NonNullable<AlbumState['currentAlbum']>;

export function resolveAlbumMaxPhotos(album: {
  maxPhotos?: number;
  photoCount?: number;
  pageCount?: number;
}): number {
  if (album.maxPhotos && album.maxPhotos > 0) return album.maxPhotos;
  if (album.photoCount && album.photoCount > 0) return album.photoCount;
  if (album.pageCount && album.pageCount > 0) return album.pageCount * 3;
  return 80;
}

export function normalizeCurrentAlbum(album: Album): Album {
  const photos = Array.isArray(album.photos) ? album.photos : [];
  const pageCount = album.pageCount > 0 ? album.pageCount : Math.max(1, Math.ceil(photos.length / 3));
  const maxPhotos = resolveAlbumMaxPhotos({ ...album, pageCount });

  return {
    ...album,
    photos,
    pageCount,
    maxPhotos,
    photoCount: maxPhotos,
  };
}
