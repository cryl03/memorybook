import AsyncStorage from '@react-native-async-storage/async-storage';
import { PageData } from './types';

const ALBUM_PAGES_KEY = '@memora_album_pages';
const ALBUM_TITLE_KEY = '@memora_album_title';

export async function saveAlbumPages(pages: PageData[]): Promise<void> {
  try {
    await AsyncStorage.setItem(ALBUM_PAGES_KEY, JSON.stringify(pages));
  } catch (error) {
    console.warn('Error saving album pages:', error);
  }
}

export async function loadAlbumPages(): Promise<PageData[] | null> {
  try {
    const data = await AsyncStorage.getItem(ALBUM_PAGES_KEY);
    if (data) {
      return JSON.parse(data);
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
    await AsyncStorage.multiRemove([ALBUM_PAGES_KEY, ALBUM_TITLE_KEY]);
  } catch (error) {
    console.warn('Error clearing album storage:', error);
  }
}
