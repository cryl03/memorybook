import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { authService } from '@core/api';
import { getErrorMessage } from '@core/api/errors';
import { normalizeEmail } from '@core/api/services/authService';
import type { AuthCredentials, RegisterPayload } from '@core/api/types';

export interface AuthState {
  token: string | null;
  username: string | null;
  email: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  token: null,
  username: null,
  email: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

function sessionFromLogin(email: string, token: string) {
  const normalized = normalizeEmail(email);
  return {
    token,
    username: normalized,
    email: normalized,
  };
}

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: AuthCredentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return sessionFromLogin(credentials.username, response.token);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'No se pudo iniciar sesión'));
    }
  },
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (payload: RegisterPayload, { rejectWithValue }) => {
    try {
      const response = await authService.register(payload);
      return sessionFromLogin(payload.email, response.token);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'No se pudo crear la cuenta'));
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.username = null;
      state.email = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
    hydrateAuth(_state, action: PayloadAction<AuthState>) {
      const payload = action.payload;
      return {
        ...initialState,
        ...payload,
        email:
          payload.email ??
          (payload.username && payload.username.includes('@')
            ? payload.username
            : null),
      };
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loginUser.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.username = action.payload.username;
        state.email = action.payload.email;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? 'No se pudo iniciar sesión';
        state.isAuthenticated = false;
      })
      .addCase(registerUser.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.username = action.payload.username;
        state.email = action.payload.email;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? 'No se pudo crear la cuenta';
        state.isAuthenticated = false;
      });
  },
});

export const { logout, clearAuthError, hydrateAuth } = authSlice.actions;
export default authSlice.reducer;
