import { albumService } from './services/albumService';
import { authService } from './services/authService';
import { fotoService } from './services/fotoService';

export { API_BASE_URL, API_UPLOADS_BASE_URL } from './config';
export { ApiError, getErrorMessage } from './errors';
export { apiRequest, setTokenGetter } from './client';
export * from './types';

export const memoraApi = {
  auth: authService,
  albums: albumService,
  fotos: fotoService,
};

export { albumService, authService, fotoService };
export { syncAlbumToApi } from './syncAlbum';
export { loadRemoteAlbumForEditor } from './loadRemoteAlbum';
export {
  syncAlbumMetadata,
  generateAlbumPdf,
  uploadMissingPhotos,
  deleteRemotePhoto,
  syncAlbumToCloud,
} from './albumSync';
export { saveAlbumToCloud, requestAlbumPdf } from './saveAlbumToCloud';
export type { SyncAlbumOptions, SyncAlbumResult } from './syncAlbum';
