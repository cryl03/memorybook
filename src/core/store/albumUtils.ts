import type { AlbumState } from './slices/albumSlice';

type Album = NonNullable<AlbumState['currentAlbum']>;

/** Package sizes from PhotoCountScreen */
export const PHOTO_PACKAGE_SIZES = [40, 80, 120] as const;

export type PhotoPackageSize = (typeof PHOTO_PACKAGE_SIZES)[number];

export function isPhotoPackageSize(value: number): value is PhotoPackageSize {
  return (PHOTO_PACKAGE_SIZES as readonly number[]).includes(value);
}

/**
 * Interior pages for alternating 1 / 2 photo slots (≈ 1.5 photos/page).
 * Matches editor distributePhotosToPages pattern — NOT ceil(n/3).
 */
export function pagesForPhotoCount(photoCount: number): number {
  if (photoCount <= 0) return 1;
  return Math.ceil((photoCount * 2) / 3);
}

/**
 * Capacity for an album:
 * - Respects chosen package (40 / 80 / 120) when known
 * - If capacity was wrongly frozen at current count (e.g. 18), snaps UP to that package
 * - Never jumps past the chosen package without an explicit upgrade
 */
export function resolvePackageCapacity(
  currentPhotos: number,
  preferredMax?: number,
): number {
  // Keep explicit package if it still covers current photos (including “full” package)
  if (
    preferredMax != null &&
    isPhotoPackageSize(preferredMax) &&
    preferredMax >= currentPhotos
  ) {
    return preferredMax;
  }

  // Keep any capacity that still allows adding more
  if (preferredMax != null && preferredMax > currentPhotos) {
    // Snap non-package leftovers up only when it's clearly a corrupted partial;
    // otherwise nearest package that fits preferred if preferred looks like a package intent
    return preferredMax;
  }

  // Corrupted maxPhotos == currentPhotos (e.g. 18): snap to smallest package that fits
  for (const size of PHOTO_PACKAGE_SIZES) {
    if (size >= currentPhotos) return size;
  }

  // Beyond largest package — stay at current (full)
  return Math.max(currentPhotos, PHOTO_PACKAGE_SIZES[PHOTO_PACKAGE_SIZES.length - 1]);
}

/** @deprecated use resolvePackageCapacity — kept for callers */
export function resolveNextPhotoCapacity(
  currentPhotos: number,
  preferredMax?: number,
): number {
  return resolvePackageCapacity(currentPhotos, preferredMax);
}

export function resolveAlbumMaxPhotos(album: {
  maxPhotos?: number;
  photoCount?: number;
  pageCount?: number;
  photos?: string[];
}): number {
  const currentPhotos = album.photos?.length ?? 0;

  // Prefer explicit package-sized max; photoCount was historically used as the package size
  const preferred =
    (album.maxPhotos && album.maxPhotos > 0 ? album.maxPhotos : 0) ||
    (album.photoCount &&
    album.photoCount > 0 &&
    isPhotoPackageSize(album.photoCount)
      ? album.photoCount
      : 0) ||
    undefined;

  return resolvePackageCapacity(currentPhotos, preferred || undefined);
}

export function normalizeCurrentAlbum(album: Album): Album {
  const photos = Array.isArray(album.photos) ? album.photos : [];
  const needed = pagesForPhotoCount(photos.length);
  const pageCount = Math.max(album.pageCount > 0 ? album.pageCount : 0, needed);
  const maxPhotos = resolveAlbumMaxPhotos({ ...album, photos, pageCount });

  return {
    ...album,
    photos,
    pageCount,
    maxPhotos,
    // photoCount keeps the package capacity (not current photo length)
    photoCount: maxPhotos,
  };
}
