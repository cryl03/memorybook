import { apiRequest } from '../client';
import type { AuthCredentials, AuthToken, RegisterPayload } from '../types';

export async function login(credentials: AuthCredentials): Promise<AuthToken> {
  return apiRequest<AuthToken>('/auth/', {
    method: 'POST',
    body: credentials,
    auth: false,
  });
}

export async function register(payload: RegisterPayload): Promise<AuthToken> {
  return apiRequest<AuthToken>('/register/', {
    method: 'POST',
    body: payload,
    auth: false,
  });
}

export const authService = {
  login,
  register,
};
