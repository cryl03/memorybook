import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { normalizeCurrentAlbum, pagesForPhotoCount } from '../albumUtils';

export interface AlbumState {
  currentAlbum: {
    title: string;
    photoCount: number;
    maxPhotos: number;
    pageCount: number;
    photos: string[];
    style: string;
    story: string;
    /** Texto de portada — se sincroniza como `descripcion` del álbum en la API */
    coverText?: string;
    remoteId?: string;
    remoteFotos?: Record<string, string>;
  } | null;
  isCreating: boolean;
  syncError: string | null;
}

const initialState: AlbumState = {
  currentAlbum: null,
  isCreating: false,
  syncError: null,
};

const albumSlice = createSlice({
  name: 'album',
  initialState,
  reducers: {
    startCreation(state) {
      state.isCreating = true;
    },
    setAlbumConfig(
      state,
      action: PayloadAction<{
        photoCount: number;
        style: string;
        story: string;
      }>,
    ) {
      state.currentAlbum = {
        title: '',
        photoCount: action.payload.photoCount,
        maxPhotos: action.payload.photoCount,
        pageCount: pagesForPhotoCount(action.payload.photoCount),
        photos: [],
        style: action.payload.style,
        story: action.payload.story,
      };
    },
    setPhotos(state, action: PayloadAction<string[]>) {
      if (state.currentAlbum) {
        state.currentAlbum.photos = action.payload;
      }
    },
    appendPhotos(state, action: PayloadAction<string[]>) {
      if (!state.currentAlbum) return;

      const existing = new Set(state.currentAlbum.photos);
      const newPhotos = action.payload.filter(uri => !existing.has(uri));
      state.currentAlbum.photos = [...state.currentAlbum.photos, ...newPhotos];
    },
    removePhoto(state, action: PayloadAction<string>) {
      if (!state.currentAlbum) return;

      state.currentAlbum.photos = state.currentAlbum.photos.filter(
        uri => uri !== action.payload,
      );

      if (state.currentAlbum.remoteFotos) {
        delete state.currentAlbum.remoteFotos[action.payload];
      }
    },
    replacePhoto(
      state,
      action: PayloadAction<{ oldUri: string; newUri: string }>,
    ) {
      if (!state.currentAlbum) return;

      const { oldUri, newUri } = action.payload;
      if (oldUri === newUri) return;

      state.currentAlbum.photos = state.currentAlbum.photos.map(uri =>
        uri === oldUri ? newUri : uri,
      );

      if (state.currentAlbum.remoteFotos?.[oldUri]) {
        const { [oldUri]: _removed, ...rest } = state.currentAlbum.remoteFotos;
        state.currentAlbum.remoteFotos = rest;
      }
    },
    setTitle(state, action: PayloadAction<string>) {
      if (state.currentAlbum) {
        state.currentAlbum.title = action.payload;
      }
    },
    setCoverText(state, action: PayloadAction<string>) {
      if (state.currentAlbum) {
        state.currentAlbum.coverText = action.payload;
      }
    },
    setStory(state, action: PayloadAction<string>) {
      if (state.currentAlbum) {
        state.currentAlbum.story = action.payload;
      }
    },
    finishCreation(state) {
      state.isCreating = false;
      if (state.currentAlbum) {
        if (!state.currentAlbum.title) {
          state.currentAlbum.title = 'Verano en la playa';
        }
        state.currentAlbum = normalizeCurrentAlbum(state.currentAlbum);
      }
    },
    setRemoteAlbumId(state, action: PayloadAction<string>) {
      if (state.currentAlbum) {
        state.currentAlbum.remoteId = action.payload;
      }
    },
    setRemoteFotos(state, action: PayloadAction<Record<string, string>>) {
      if (state.currentAlbum) {
        state.currentAlbum.remoteFotos = action.payload;
      }
    },
    mergeRemoteFotos(state, action: PayloadAction<Record<string, string>>) {
      if (state.currentAlbum) {
        state.currentAlbum.remoteFotos = {
          ...state.currentAlbum.remoteFotos,
          ...action.payload,
        };
      }
    },
    setSyncError(state, action: PayloadAction<string | null>) {
      state.syncError = action.payload;
    },
    resetAlbum(state) {
      state.currentAlbum = null;
      state.isCreating = false;
      state.syncError = null;
    },
    loadFromRemote(
      state,
      action: PayloadAction<{
        title: string;
        photoCount: number;
        maxPhotos?: number;
        pageCount: number;
        photos: string[];
        style: string;
        story: string;
        coverText?: string;
        remoteId: string;
        remoteFotos?: Record<string, string>;
      }>,
    ) {
      state.currentAlbum = {
        ...action.payload,
        maxPhotos: action.payload.maxPhotos ?? action.payload.photoCount,
        coverText: action.payload.coverText ?? action.payload.story ?? '',
      };
      state.isCreating = false;
      state.syncError = null;
    },
    hydrateAlbum(_state, action: PayloadAction<AlbumState>) {
      const next = action.payload;
      if (next.currentAlbum) {
        next.currentAlbum = normalizeCurrentAlbum(next.currentAlbum);
      }
      return next;
    },
    repairAlbum(state) {
      if (state.currentAlbum) {
        state.currentAlbum = normalizeCurrentAlbum(state.currentAlbum);
      }
    },
    /** Unlock capacity when maxPhotos was frozen at current photo count */
    ensurePhotoCapacity(state) {
      if (!state.currentAlbum) return;
      state.currentAlbum = normalizeCurrentAlbum(state.currentAlbum);
    },
  },
});

export const {
  startCreation,
  setAlbumConfig,
  setPhotos,
  appendPhotos,
  removePhoto,
  replacePhoto,
  setTitle,
  setCoverText,
  setStory,
  finishCreation,
  setRemoteAlbumId,
  setRemoteFotos,
  mergeRemoteFotos,
  setSyncError,
  loadFromRemote,
  resetAlbum,
  hydrateAlbum,
  repairAlbum,
  ensurePhotoCapacity,
} = albumSlice.actions;

export default albumSlice.reducer;
