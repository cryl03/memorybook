import type { AppDispatch, RootState } from '@core/store';
import { mergeRemoteFotos, setPdfUrl, setRemoteAlbumId, setSyncError } from '@core/store/slices/albumSlice';
import { getErrorMessage } from './errors';
import { syncAlbumToCloud } from './albumSync';
import { syncAlbumToApi } from './syncAlbum';
import { loadCoverText } from '@features/editor/storage';

export interface SyncProgressHandler {
  onProgress?: (step: string, progress: number) => void;
  descriptionOverride?: string;
}

export function albumNeedsCloudSync(state: RootState): boolean {
  const current = state.album.currentAlbum;
  if (!current || current.photos.length === 0) return false;
  if (!current.remoteId) return true;
  return current.photos.some(uri => !current.remoteFotos?.[uri]);
}

async function resolveDescription(
  current: NonNullable<RootState['album']['currentAlbum']>,
  override?: string,
): Promise<string> {
  if (override?.trim()) return override.trim();
  if (current.coverText?.trim()) return current.coverText.trim();
  const stored =
    (await loadCoverText(current.remoteId || 'local')) ||
    (await loadCoverText('local'));
  if (stored.trim()) return stored.trim();
  return current.story || '';
}

export async function syncLocalAlbumOnAuth(
  dispatch: AppDispatch,
  getState: () => RootState,
  options?: SyncProgressHandler,
): Promise<boolean> {
  const { album, auth } = getState();
  const onProgress = options?.onProgress;

  if (!auth.isAuthenticated) return false;

  const current = album.currentAlbum;
  if (!current || current.photos.length === 0) return false;

  const description = await resolveDescription(
    current,
    options?.descriptionOverride,
  );

  // Idempotent: already linked → update metadata/photos only
  try {
    if (current.remoteId) {
      const { remoteFotos, pdfUrl } = await syncAlbumToCloud({
        remoteId: current.remoteId,
        title: current.title || 'Mi álbum',
        story: description,
        photoUris: current.photos,
        remoteFotos: current.remoteFotos,
        style: current.style,
        onboardingStory: current.story,
        fotosPorPagina: current.fotosPorPagina,
        onProgress,
      });

      dispatch(mergeRemoteFotos(remoteFotos));
      if (pdfUrl) {
        dispatch(setPdfUrl(pdfUrl));
      }
      dispatch(setSyncError(null));
      return true;
    }

    onProgress?.('Preparando sincronización', 0);

    const result = await syncAlbumToApi({
      title: current.title || 'Mi álbum',
      description,
      photoUris: current.photos,
      story: current.story,
      style: current.style,
      fotosPorPagina: current.fotosPorPagina,
      onProgress,
    });

    // Set remoteId FIRST so any concurrent save won't create another album
    if (result.album.unique_id) {
      dispatch(setRemoteAlbumId(result.album.unique_id));
    }

    if (Object.keys(result.remoteFotos).length > 0) {
      dispatch(mergeRemoteFotos(result.remoteFotos));
    }

    if (result.pdfUrl) {
      dispatch(setPdfUrl(result.pdfUrl));
    }

    dispatch(setSyncError(null));
    onProgress?.('Álbum listo', 1);
    return true;
  } catch (error) {
    const message = getErrorMessage(error, 'No se pudo sincronizar el álbum');
    dispatch(setSyncError(message));
    throw error;
  }
}
