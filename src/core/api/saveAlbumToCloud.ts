import { Alert } from 'react-native';
import { syncAlbumToCloud } from './albumSync';
import { getErrorMessage } from '@core/api/errors';
import type { AppDispatch, RootState } from '@core/store';
import {
  mergeRemoteFotos,
  setSyncError,
  setTitle,
} from '@core/store/slices/albumSlice';
import { syncLocalAlbumOnAuth } from './syncLocalAlbumOnAuth';
import { loadCoverText } from '@features/editor/storage';

let saveInFlight = false;

export type SaveAlbumOptions = {
  onProgress?: (step: string, progress: number) => void;
};

async function resolveAlbumDescription(current: {
  remoteId?: string;
  coverText?: string;
  story: string;
}): Promise<string> {
  const fromState = current.coverText?.trim();
  if (fromState) return fromState;

  const fromStorage =
    (await loadCoverText(current.remoteId || 'local')) ||
    (await loadCoverText('local'));
  if (fromStorage.trim()) return fromStorage.trim();

  return current.story || '';
}

export async function saveAlbumToCloud(
  dispatch: AppDispatch,
  getState: () => RootState,
  titleOverride?: string,
  options?: SaveAlbumOptions,
): Promise<boolean> {
  if (saveInFlight) return false;
  saveInFlight = true;

  try {
    const { album, auth } = getState();
    const current = album.currentAlbum;
    const onProgress = options?.onProgress;

    if (!auth.isAuthenticated) {
      return true;
    }

    if (!current) {
      return false;
    }

    const description = await resolveAlbumDescription(current);

    // Already on cloud → update only, never create again
    if (current.remoteId) {
      const title = titleOverride ?? current.title;

      try {
        const remoteFotos = await syncAlbumToCloud({
          remoteId: current.remoteId,
          title,
          story: description,
          photoUris: current.photos,
          remoteFotos: current.remoteFotos,
          onProgress,
        });

        dispatch(mergeRemoteFotos(remoteFotos));
        dispatch(setTitle(title));
        dispatch(setSyncError(null));
        return true;
      } catch (error) {
        const message = getErrorMessage(error, 'No se pudo guardar en la nube');
        dispatch(setSyncError(message));
        Alert.alert('Error de sincronización', message);
        return false;
      }
    }

    try {
      await syncLocalAlbumOnAuth(dispatch, getState, {
        descriptionOverride: description,
        onProgress,
      });
      if (titleOverride) {
        dispatch(setTitle(titleOverride));
      }
      return true;
    } catch (error) {
      const message = getErrorMessage(error, 'No se pudo guardar en la nube');
      dispatch(setSyncError(message));
      Alert.alert('Error de sincronización', message);
      return false;
    }
  } finally {
    saveInFlight = false;
  }
}
