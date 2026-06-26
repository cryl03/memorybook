import { PageData, LayoutType, PagePhoto } from './types';

/**
 * Distributes photos across pages based on the default layout strategy.
 * Returns an array of PageData objects ready for the editor.
 */
export function distributePhotosToPages(
  photoUris: string[],
  pageCount: number,
): PageData[] {
  const pages: PageData[] = [];
  const photosPerPage = Math.ceil(photoUris.length / pageCount);
  let photoIndex = 0;

  for (let i = 0; i < pageCount; i++) {
    const pagePhotos: PagePhoto[] = [];
    const count = Math.min(photosPerPage, photoUris.length - photoIndex);

    for (let j = 0; j < count; j++) {
      if (photoIndex < photoUris.length) {
        pagePhotos.push({
          uri: photoUris[photoIndex],
          filter: 'none',
          order: j,
        });
        photoIndex++;
      }
    }

    // Choose default layout based on photo count
    let defaultLayout: LayoutType = 'single';
    if (pagePhotos.length === 2) defaultLayout = 'grid-2';
    else if (pagePhotos.length >= 3) defaultLayout = 'grid-4';

    pages.push({
      id: `page-${i}`,
      photos: pagePhotos,
      layout: defaultLayout,
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
    case 'grid-4':
    case 'collage':
      return 4;
    default:
      return 4;
  }
}

/**
 * Generate a unique ID.
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
