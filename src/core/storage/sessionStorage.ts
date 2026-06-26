import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserState } from '@core/store/slices/userSlice';
import type { AlbumState } from '@core/store/slices/albumSlice';
import type { AuthState } from '@core/store/slices/authSlice';

const SESSION_KEY = '@memora_session';

export interface PersistedSession {
  user: UserState;
  album: AlbumState;
  auth: AuthState;
}

export async function saveSession(session: PersistedSession): Promise<void> {
  try {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.warn('Error saving session:', error);
  }
}

export async function loadSession(): Promise<PersistedSession | null> {
  try {
    const data = await AsyncStorage.getItem(SESSION_KEY);
    if (!data) return null;
    return JSON.parse(data) as PersistedSession;
  } catch (error) {
    console.warn('Error loading session:', error);
    return null;
  }
}

export async function clearSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.warn('Error clearing session:', error);
  }
}
