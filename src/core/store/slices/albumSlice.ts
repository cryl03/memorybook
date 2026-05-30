import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AlbumState {
  currentAlbum: {
    title: string;
    photoCount: number;
    pageCount: number;
    photos: string[];
    style: string;
    story: string;
  } | null;
  isCreating: boolean;
}

const initialState: AlbumState = {
  currentAlbum: null,
  isCreating: false,
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
        pageCount: Math.ceil(action.payload.photoCount / 3),
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
    setTitle(state, action: PayloadAction<string>) {
      if (state.currentAlbum) {
        state.currentAlbum.title = action.payload;
      }
    },
    finishCreation(state) {
      state.isCreating = false;
      if (state.currentAlbum && !state.currentAlbum.title) {
        state.currentAlbum.title = 'Verano en la playa';
      }
    },
    resetAlbum(state) {
      state.currentAlbum = null;
      state.isCreating = false;
    },
  },
});

export const {
  startCreation,
  setAlbumConfig,
  setPhotos,
  setTitle,
  finishCreation,
  resetAlbum,
} = albumSlice.actions;

export default albumSlice.reducer;
