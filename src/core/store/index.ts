import { configureStore } from '@reduxjs/toolkit';
import albumReducer from './slices/albumSlice';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    album: albumReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
