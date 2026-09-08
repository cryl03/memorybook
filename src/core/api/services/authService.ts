import { apiRequest } from '../client';
import { ApiError } from '../errors';
import type {
  AuthCredentials,
  AuthToken,
  RegisterPayload,
  Usuario,
} from '../types';

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export async function login(credentials: AuthCredentials): Promise<AuthToken> {
  return apiRequest<AuthToken>('/auth/', {
    method: 'POST',
    body: {
      username: normalizeEmail(credentials.username),
      password: credentials.password,
    },
    auth: false,
  });
}

function registerNames(payload: RegisterPayload): {
  first_name: string;
  last_name: string;
} {
  const first = payload.first_name?.trim();
  const last = payload.last_name?.trim();
  return {
    first_name: first || 'Usuario',
    last_name: last || 'Memora',
  };
}

/** Login identity = email. Display name is collected later and is not unique. */
function loginUsernameFromEmail(email: string): string {
  return normalizeEmail(email);
}

/** POST `/usuario/create` — no token. Caller must login after. */
export async function createUsuario(payload: RegisterPayload): Promise<Usuario> {
  const email = normalizeEmail(payload.email);
  const names = registerNames(payload);

  return apiRequest<Usuario>('/usuario/create', {
    method: 'POST',
    body: {
      username: loginUsernameFromEmail(email),
      email,
      password: payload.password,
      first_name: names.first_name,
      last_name: names.last_name,
    },
    auth: false,
  });
}

export async function register(payload: RegisterPayload): Promise<AuthToken> {
  const email = normalizeEmail(payload.email);
  await createUsuario(payload);
  return login({
    username: loginUsernameFromEmail(email),
    password: payload.password,
  });
}

/**
 * Sandbox API has no reset route (only `/auth/` + `/usuario/create`).
 * Try likely paths; 404 still resolves so UI can show the generic message.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const body = { email: normalizeEmail(email) };
  const paths = ['/usuario/password-reset', '/auth/password-reset/'];

  for (const path of paths) {
    try {
      await apiRequest(path, {
        method: 'POST',
        body,
        auth: false,
      });
      return;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        continue;
      }
      throw error;
    }
  }
}

export const authService = {
  login,
  register,
  createUsuario,
  requestPasswordReset,
};
