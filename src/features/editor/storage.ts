import AsyncStorage from '@react-native-async-storage/async-storage';
import { PageData, LayoutType } from './types';
import { distributePhotosToPages } from './utils';

const ALBUM_PAGES_KEY = '@memora_album_pages';
const ALBUM_TITLE_KEY = '@memora_album_title';
const COVER_TEXT_PREFIX = '@memora_cover_text:';

const DEFAULT_COVER_PAGE: PageData = {
  id: 'page-cover',
  photos: [],
  layout: 'single' as LayoutType,
  text: { content: '', fontSize: 14, alignment: 'center' },
  stickers: [],
};

export function coverTextStorageKey(albumKey: string = 'local'): string {
  return `${COVER_TEXT_PREFIX}${albumKey || 'local'}`;
}

export function getCoverTextFromPages(pages: PageData[]): string {
  const cover =
    pages.find(page => page.id === 'page-cover') ?? pages[0];
  return cover?.text?.content?.trim() ?? '';
}

export async function saveCoverText(
  albumKey: string,
  text: string,
): Promise<void> {
  try {
    const key = coverTextStorageKey(albumKey);
    if (text.trim()) {
      await AsyncStorage.setItem(key, text);
    } else {
      await AsyncStorage.removeItem(key);
    }
  } catch (error) {
    console.warn('Error saving cover text:', error);
  }
}

export async function loadCoverText(albumKey: string): Promise<string> {
  try {
    return (await AsyncStorage.getItem(coverTextStorageKey(albumKey))) ?? '';
  } catch (error) {
    console.warn('Error loading cover text:', error);
    return '';
  }
}

export async function saveAlbumPages(pages: PageData[]): Promise<void> {
  try {
    await AsyncStorage.setItem(ALBUM_PAGES_KEY, JSON.stringify(pages));
  } catch (error) {
    console.warn('Error saving album pages:', error);
  }
}

/** Persist pages + cover text (local and/or remote album id) */
export async function persistEditorState(options: {
  pages: PageData[];
  title?: string;
  albumKey?: string;
}): Promise<void> {
  const { pages, title, albumKey = 'local' } = options;
  await saveAlbumPages(pages);
  if (title != null && title.length > 0) {
    await saveAlbumTitle(title);
  }
  await saveCoverText(albumKey, getCoverTextFromPages(pages));
  // Also mirror under "local" so reopen without remoteId still works
  if (albumKey !== 'local') {
    await saveCoverText('local', getCoverTextFromPages(pages));
  }
}

export async function loadAlbumPages(): Promise<PageData[] | null> {
  try {
    const data = await AsyncStorage.getItem(ALBUM_PAGES_KEY);
    if (data) {
      return JSON.parse(data) as PageData[];
    }
    return null;
  } catch (error) {
    console.warn('Error loading album pages:', error);
    return null;
  }
}

export async function saveAlbumTitle(title: string): Promise<void> {
  try {
    await AsyncStorage.setItem(ALBUM_TITLE_KEY, title);
  } catch (error) {
    console.warn('Error saving album title:', error);
  }
}

export async function loadAlbumTitle(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ALBUM_TITLE_KEY);
  } catch (error) {
    console.warn('Error loading album title:', error);
    return null;
  }
}

export async function hasSavedAlbum(): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(ALBUM_PAGES_KEY);
    return data !== null && data.length > 2;
  } catch {
    return false;
  }
}

export async function clearAlbumStorage(): Promise<void> {
  try {
    // Keep per-album cover text keys so reopen from cloud can restore them
    await AsyncStorage.multiRemove([ALBUM_PAGES_KEY, ALBUM_TITLE_KEY]);
  } catch (error) {
    console.warn('Error clearing album storage:', error);
  }
}

export async function syncPagesWithPhotos(
  photos: string[],
  pageCount: number,
): Promise<void> {
  const savedPages = await loadAlbumPages();
  const coverPage =
    savedPages?.find(page => page.id === 'page-cover') ??
    savedPages?.[0] ??
    DEFAULT_COVER_PAGE;
  const distributed = distributePhotosToPages(photos, pageCount);
  await saveAlbumPages([{ ...coverPage, id: 'page-cover' }, ...distributed]);
}
