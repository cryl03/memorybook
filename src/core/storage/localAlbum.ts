import type { AlbumState } from '@core/store/slices/albumSlice';

export const LOCAL_ALBUM_ID = '__local__';

export interface LocalAlbumSummary {
  id: typeof LOCAL_ALBUM_ID;
  title: string;
  photoCount: number;
  pageCount: number;
  coverUri: string | null;
}

export function getLocalAlbumSummary(
  album: AlbumState['currentAlbum'],
): LocalAlbumSummary | null {
  if (!album || album.photos.length === 0) return null;

  return {
    id: LOCAL_ALBUM_ID,
    title: album.title || 'Mi álbum',
    photoCount: album.photos.length,
    pageCount: album.pageCount,
    coverUri: album.photos[0] ?? null,
  };
}

export function isLocalAlbumId(projectId: string): boolean {
  return projectId === LOCAL_ALBUM_ID;
}
