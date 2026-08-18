import { PageData, LayoutType, PagePhoto } from './types';

/**
 * Páginas interiores necesarias con patrón 1 / 2 / 1 / 2 …
 * (promedio 1.5 fotos por página — no ceil(n/3)).
 */
export function pagesNeededForSlotPattern(photoCount: number): number {
  if (photoCount <= 0) return 1;
  let pages = 0;
  let placed = 0;
  while (placed < photoCount) {
    placed += pages % 2 === 0 ? 1 : 2;
    pages += 1;
  }
  return pages;
}

function resolveLayoutFromCount(count: number): LayoutType {
  if (count <= 1) return 'single';
  if (count === 2) return 'grid-2';
  if (count === 3) return 'collage';
  return 'grid-4';
}

/**
 * Distributes ALL photos across pages (1 then 2 alternating).
 * If pageCount is too small for the slot pattern, pages are added until every photo fits.
 */
export function distributePhotosToPages(
  photoUris: string[],
  pageCount: number,
): PageData[] {
  const totalPages = Math.max(pageCount, pagesNeededForSlotPattern(photoUris.length));
  const pages: PageData[] = [];
  let photoIndex = 0;

  for (let i = 0; i < totalPages; i++) {
    const pagePhotos: PagePhoto[] = [];
    const slotsThisPage = i % 2 === 0 ? 1 : 2;

    for (let j = 0; j < slotsThisPage && photoIndex < photoUris.length; j++) {
      pagePhotos.push({
        uri: photoUris[photoIndex],
        filter: 'none',
        order: j,
      });
      photoIndex++;
    }

    pages.push({
      id: `page-${i}`,
      photos: pagePhotos,
      layout: resolveLayoutFromCount(pagePhotos.length),
      text: { content: '', fontSize: 14, alignment: 'center' },
      stickers: [],
    });
  }

  // Safety: if anything still remains, pack up to 4 per page then append extra pages
  while (photoIndex < photoUris.length) {
    const pagePhotos: PagePhoto[] = [];
    while (pagePhotos.length < 4 && photoIndex < photoUris.length) {
      pagePhotos.push({
        uri: photoUris[photoIndex],
        filter: 'none',
        order: pagePhotos.length,
      });
      photoIndex++;
    }
    pages.push({
      id: `page-${pages.length}`,
      photos: pagePhotos,
      layout: resolveLayoutFromCount(pagePhotos.length),
      text: { content: '', fontSize: 14, alignment: 'center' },
      stickers: [],
    });
  }

  return pages;
}

/**
 * Gets the max photos allowed for a layout type.
 */
export function getMaxPhotosForLayout(layout: LayoutType): number {
  switch (layout) {
    case 'single':
    case 'full-bleed':
      return 1;
    case 'grid-2':
      return 2;
    case 'collage':
      return 3;
    case 'grid-4':
      return 4;
    default:
      return 4;
  }
}

/**
 * Redistributes album photos using fixed slots-per-page (Diseño 1–4).
 * Preserves cover page (index 0 / id page-cover).
 */
export function redistributePagesWithDesign(
  pages: PageData[],
  photoUris: string[],
  fotosPorPagina: 1 | 2 | 3 | 4,
): PageData[] {
  const pageLayout: LayoutType =
    fotosPorPagina === 1
      ? 'single'
      : fotosPorPagina === 2
        ? 'grid-2'
        : fotosPorPagina === 3
          ? 'collage'
          : 'grid-4';

  const coverIndex = pages.findIndex(p => p.id === 'page-cover');
  const cover = coverIndex >= 0 ? pages[coverIndex] : null;
  const oldInterior = pages.filter(
    (p, i) => p.id !== 'page-cover' && i !== coverIndex,
  );

  const interior: PageData[] = [];
  let photoIndex = 0;
  let pageNum = 0;

  while (photoIndex < photoUris.length) {
    const pagePhotos: PagePhoto[] = [];
    while (
      pagePhotos.length < fotosPorPagina &&
      photoIndex < photoUris.length
    ) {
      pagePhotos.push({
        uri: photoUris[photoIndex],
        filter: 'none',
        order: pagePhotos.length,
      });
      photoIndex += 1;
    }

    interior.push({
      id: `page-${pageNum}`,
      photos: pagePhotos,
      layout: pageLayout,
      text: oldInterior[pageNum]?.text ?? {
        content: '',
        fontSize: 14,
        alignment: 'center',
      },
      stickers: oldInterior[pageNum]?.stickers ?? [],
    });
    pageNum += 1;
  }

  if (interior.length === 0) {
    interior.push({
      id: 'page-0',
      photos: [],
      layout: pageLayout,
      text: { content: '', fontSize: 14, alignment: 'center' },
      stickers: [],
    });
  }

  if (cover) {
    return [cover, ...interior];
  }

  return interior;
}

/** Huecos según diseño de la página; fallback patrón 1/2. */
export function preferredSlotsForPage(
  pageIndex: number,
  layout?: LayoutType,
): number {
  if (layout) return getMaxPhotosForLayout(layout);
  if (pageIndex <= 0) return 1;
  return (pageIndex - 1) % 2 === 0 ? 1 : 2;
}

function countInteriorPhotos(pages: PageData[]): number {
  return pages.reduce((sum, page, index) => {
    if (index === 0 || page.id === 'page-cover') return sum;
    return sum + page.photos.length;
  }, 0);
}

/**
 * Si el álbum tiene más fotos que las páginas guardadas, redistribuye
 * todas las fotos del álbum (conserva portada: texto / stickers).
 */
export function ensureAllPhotosOnPages(
  pages: PageData[],
  albumPhotoUris: string[],
): PageData[] {
  if (albumPhotoUris.length === 0) return pages;

  const onPages = new Set<string>();
  pages.forEach(page => {
    page.photos.forEach(photo => onPages.add(photo.uri));
  });

  const missing = albumPhotoUris.filter(uri => !onPages.has(uri));
  const interiorCount = countInteriorPhotos(pages);

  if (missing.length === 0 && interiorCount >= albumPhotoUris.length) {
    return pages;
  }

  const cover =
    pages.find(page => page.id === 'page-cover') ??
    pages[0] ??
    ({
      id: 'page-cover',
      photos: [],
      layout: 'single' as LayoutType,
      text: { content: '', fontSize: 14, alignment: 'center' as const },
      stickers: [],
    } satisfies PageData);

  const coverPage: PageData = {
    ...cover,
    id: 'page-cover',
    photos: cover.photos ?? [],
  };

  const needed = pagesNeededForSlotPattern(albumPhotoUris.length);
  const distributed = distributePhotosToPages(albumPhotoUris, needed);

  return [coverPage, ...distributed];
}

/**
 * Coloca fotos nuevas desde startPageIndex hacia adelante (luego el resto),
 * llenando huecos vacíos con 1 o 2 fotos por página. El sobrante sigue a las otras.
 */
export function placePhotosAcrossPages(
  pages: PageData[],
  uris: string[],
  startPageIndex: number,
): PageData[] {
  if (uris.length === 0) return pages;

  let cursor = 0;
  const next = pages.map(page => ({
    ...page,
    photos: page.photos.map(photo => ({ ...photo })),
  }));

  const order: number[] = [];
  for (let i = startPageIndex; i < next.length; i += 1) order.push(i);
  for (let i = 1; i < startPageIndex; i += 1) order.push(i);

  for (const pageIndex of order) {
    if (cursor >= uris.length) break;
    if (pageIndex === 0 && startPageIndex !== 0) continue;

    const preferred = preferredSlotsForPage(
      pageIndex,
      next[pageIndex].layout,
    );
    const currentCount = next[pageIndex].photos.length;
    const room = preferred - currentCount;
    if (room <= 0) continue;

    const take = Math.min(room, uris.length - cursor);
    const additions: PagePhoto[] = [];
    for (let j = 0; j < take; j += 1) {
      additions.push({
        uri: uris[cursor],
        filter: 'none',
        order: currentCount + j,
      });
      cursor += 1;
    }

    const photos = [...next[pageIndex].photos, ...additions].map((photo, orderIdx) => ({
      ...photo,
      order: orderIdx,
    }));

    next[pageIndex] = {
      ...next[pageIndex],
      photos,
      layout: resolveLayoutFromCount(photos.length),
    };
  }

  // Si aún sobran y hay páginas con espacio (< 4), las reparte adaptando el layout
  if (cursor < uris.length) {
    for (const pageIndex of order) {
      if (cursor >= uris.length) break;
      if (pageIndex === 0 && startPageIndex !== 0) continue;

      const currentCount = next[pageIndex].photos.length;
      const room = 4 - currentCount;
      if (room <= 0) continue;

      const take = Math.min(room, uris.length - cursor);
      const additions: PagePhoto[] = [];
      for (let j = 0; j < take; j += 1) {
        additions.push({
          uri: uris[cursor],
          filter: 'none',
          order: currentCount + j,
        });
        cursor += 1;
      }

      const photos = [...next[pageIndex].photos, ...additions].map((photo, orderIdx) => ({
        ...photo,
        order: orderIdx,
      }));

      next[pageIndex] = {
        ...next[pageIndex],
        photos,
        layout: resolveLayoutFromCount(photos.length),
      };
    }
  }

  // Si todavía sobran, agrega páginas nuevas con el patrón 1/2
  if (cursor < uris.length) {
    const remaining = uris.slice(cursor);
    const extra = distributePhotosToPages(remaining, pagesNeededForSlotPattern(remaining.length));
    const baseIndex = next.length;
    extra.forEach((page, i) => {
      next.push({
        ...page,
        id: `page-${baseIndex + i}`,
      });
    });
  }

  return next;
}

export function countAvailablePhotoSlots(
  pages: PageData[],
  startPageIndex: number,
): number {
  let slots = 0;
  const order: number[] = [];
  for (let i = startPageIndex; i < pages.length; i += 1) order.push(i);
  for (let i = 1; i < startPageIndex; i += 1) order.push(i);

  for (const pageIndex of order) {
    if (pageIndex === 0 && startPageIndex !== 0) continue;
    const max = getMaxPhotosForLayout(pages[pageIndex]?.layout ?? 'grid-4');
    slots += Math.max(0, max - (pages[pageIndex]?.photos.length ?? 0));
  }

  // Always allow adding more by creating new pages later
  return Math.max(slots, 40);
}

/**
 * Generate a unique ID.
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
