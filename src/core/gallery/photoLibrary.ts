import { Platform, PermissionsAndroid, Linking } from 'react-native';
import {
  CameraRoll,
  iosReadGalleryPermission,
  iosRequestReadWriteGalleryPermission,
  iosRefreshGallerySelection,
  type Album,
  type AlbumType,
  type GroupTypes,
} from '@react-native-camera-roll/camera-roll';

export const RECENTS_ALBUM_ID = '__recents__';

export type GalleryAlbumOption = {
  id: string;
  title: string;
  count: number;
  groupName?: string;
  groupTypes?: GroupTypes;
};

export const RECENTS_ALBUM: GalleryAlbumOption = {
  id: RECENTS_ALBUM_ID,
  title: 'Recientes',
  count: 0,
  groupTypes: 'All',
};

const SKIP_TITLES = new Set([
  'recents',
  'recientes',
  'recentes',
  'recently added',
  'añadidos recientemente',
  'anadidos recientemente',
  'camera roll',
  'all photos',
  'todas las fotos',
  'todas as fotos',
]);

function isRecentsTitle(title: string): boolean {
  return SKIP_TITLES.has(title.trim().toLowerCase());
}

export async function requestPhotoLibraryAccess(): Promise<{
  granted: boolean;
  limited: boolean;
}> {
  if (Platform.OS === 'android') {
    const version = Number(Platform.Version);
    const permission =
      version >= 33
        ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
    const granted = await PermissionsAndroid.request(permission);
    return {
      granted: granted === PermissionsAndroid.RESULTS.GRANTED,
      limited: false,
    };
  }

  try {
    let status = await iosReadGalleryPermission('readWrite');
    if (status === 'not-determined') {
      status = await iosRequestReadWriteGalleryPermission();
    }
    if (status === 'granted') {
      return { granted: true, limited: false };
    }
    if (status === 'limited') {
      return { granted: true, limited: true };
    }
    return { granted: false, limited: false };
  } catch {
    return { granted: true, limited: false };
  }
}

async function safeGetAlbums(albumType: AlbumType): Promise<Album[]> {
  try {
    return await CameraRoll.getAlbums({ assetType: 'Photos', albumType });
  } catch {
    return [];
  }
}

export async function loadGalleryAlbums(): Promise<GalleryAlbumOption[]> {
  let nativeAlbums = await safeGetAlbums('All');
  if (nativeAlbums.length === 0) {
    const [userAlbums, smartAlbums] = await Promise.all([
      safeGetAlbums('Album'),
      Platform.OS === 'ios' ? safeGetAlbums('SmartAlbum') : Promise.resolve([]),
    ]);
    nativeAlbums = [...userAlbums, ...smartAlbums];
  }

  const seen = new Set<string>();
  const rest: GalleryAlbumOption[] = [];

  for (const album of nativeAlbums) {
    if (album.count <= 0 || isRecentsTitle(album.title)) continue;
    const key = `${album.type}:${album.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rest.push({
      id: album.id || key,
      title: album.title,
      count: album.count,
      groupName: album.title,
      groupTypes: album.type === 'SmartAlbum' ? 'SmartAlbum' : 'Album',
    });
  }

  rest.sort((a, b) => b.count - a.count || a.title.localeCompare(b.title, 'es'));
  return [RECENTS_ALBUM, ...rest];
}

export function buildGetPhotosParams(
  album: GalleryAlbumOption,
  after?: string,
  first = 60,
) {
  return {
    first,
    after,
    assetType: 'Photos' as const,
    include: ['filename' as const],
    ...(album.groupName
      ? {
          groupName: album.groupName,
          groupTypes: album.groupTypes ?? 'Album',
        }
      : { groupTypes: 'All' as const }),
  };
}

export async function refreshLimitedPhotoSelection(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await iosRefreshGallerySelection();
  } catch {
    return false;
  }
}

export function openPhotoSettings(): void {
  void Linking.openSettings();
}
