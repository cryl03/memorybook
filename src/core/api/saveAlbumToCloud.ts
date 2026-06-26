import { Alert } from 'react-native';
import { syncAlbumToCloud, generateAlbumPdf } from '@core/api';
import { getErrorMessage } from '@core/api/errors';
import type { AppDispatch, RootState } from '@core/store';
import {
  mergeRemoteFotos,
  setSyncError,
  setTitle,
} from '@core/store/slices/albumSlice';

export async function saveAlbumToCloud(
  dispatch: AppDispatch,
  getState: () => RootState,
  titleOverride?: string,
): Promise<boolean> {
  const { album, auth } = getState();
  const current = album.currentAlbum;

  if (!auth.isAuthenticated || !current?.remoteId) {
    return true;
  }

  const title = titleOverride ?? current.title;

  try {
    const remoteFotos = await syncAlbumToCloud({
      remoteId: current.remoteId,
      title,
      story: current.story,
      photoUris: current.photos,
      remoteFotos: current.remoteFotos,
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

export async function requestAlbumPdf(
  dispatch: AppDispatch,
  getState: () => RootState,
): Promise<boolean> {
  const { album, auth } = getState();
  const remoteId = album.currentAlbum?.remoteId;

  if (!auth.isAuthenticated) {
    Alert.alert('Inicia sesión', 'Necesitas una cuenta para generar el PDF.');
    return false;
  }

  if (!remoteId) {
    Alert.alert(
      'Álbum no sincronizado',
      'Guarda el álbum en la nube antes de generar el PDF.',
    );
    return false;
  }

  try {
    const saved = await saveAlbumToCloud(dispatch, getState);
    if (!saved) return false;

    await generateAlbumPdf(remoteId);
    dispatch(setSyncError(null));
    Alert.alert('PDF listo', 'El PDF de tu álbum se generó correctamente.');
    return true;
  } catch (error) {
    const message = getErrorMessage(error, 'No se pudo generar el PDF');
    dispatch(setSyncError(message));
    Alert.alert('Error', message);
    return false;
  }
}
