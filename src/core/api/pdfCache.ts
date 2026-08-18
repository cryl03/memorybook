import { normalizeAlbumId } from './albumId';

const cache = new Map<string, ArrayBuffer>();

export function setCachedPdf(albumId: string, bytes: ArrayBuffer): void {
  cache.set(normalizeAlbumId(albumId), bytes);
}

export function getCachedPdf(albumId: string): ArrayBuffer | null {
  return cache.get(normalizeAlbumId(albumId)) ?? null;
}

export function clearCachedPdf(albumId: string): void {
  cache.delete(normalizeAlbumId(albumId));
}
