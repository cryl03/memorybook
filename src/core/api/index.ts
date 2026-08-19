import { albumService } from './services/albumService';
import { authService } from './services/authService';
import { fotoService } from './services/fotoService';

export { API_BASE_URL, API_UPLOADS_BASE_URL, ALLOW_GUEST_FLOW } from './config';
export { ApiError, getErrorMessage } from './errors';
export { apiRequest, apiRequestPdf, setTokenGetter, getAuthToken } from './client';
export * from './types';
export {
  toEstiloDefault,
  fromEstiloDefault,
  toStoryId,
  toToneId,
  toFotosPorPagina,
  toCapacidadFotos,
  toNPaginasDiseno,
  resolveFotosPorPagina,
} from './estilo';
export { normalizeAlbumId, albumIdsEqual } from './albumId';

export const memoraApi = {
  auth: authService,
  albums: albumService,
  fotos: fotoService,
};

export { albumService, authService, fotoService };
export { syncAlbumToApi } from './syncAlbum';
export { loadRemoteAlbumForEditor, openRemoteAlbumForPreview } from './loadRemoteAlbum';
export {
  syncAlbumMetadata,
  generateAlbumPdf,
  uploadMissingPhotos,
  deleteRemotePhoto,
  syncAlbumToCloud,
} from './albumSync';
export { saveAlbumToCloud } from './saveAlbumToCloud';
export { albumNeedsCloudSync, syncLocalAlbumOnAuth } from './syncLocalAlbumOnAuth';
export type { SyncProgressHandler } from './syncLocalAlbumOnAuth';
export type { SyncAlbumOptions, SyncAlbumResult } from './syncAlbum';
