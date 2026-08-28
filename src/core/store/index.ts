import { configureStore } from '@reduxjs/toolkit';
import albumReducer from './slices/albumSlice';
import userReducer from './slices/userSlice';
import authReducer from './slices/authSlice';
import { saveSession } from '@core/storage/sessionStorage';
import { setTokenGetter } from '@core/api';
import { resetSyncAlbumLock } from '@core/api/syncAlbum';

export const store = configureStore({
  reducer: {
    album: albumReducer,
    user: userReducer,
    auth: authReducer,
  },
});

setTokenGetter(() => store.getState().auth.token);

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let hadAlbum = Boolean(store.getState().album.currentAlbum);

store.subscribe(() => {
  const { user, album, auth } = store.getState();
  const hasAlbum = Boolean(album.currentAlbum);
  if (hadAlbum && !hasAlbum) {
    resetSyncAlbumLock();
  }
  hadAlbum = hasAlbum;

  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    saveSession({ user, album, auth });
  }, 300);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
