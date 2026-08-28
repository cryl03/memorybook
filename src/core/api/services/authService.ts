import { apiRequest } from '../client';
import type {
  AuthCredentials,
  AuthToken,
  RegisterPayload,
  Usuario,
} from '../types';

export async function login(credentials: AuthCredentials): Promise<AuthToken> {
  return apiRequest<AuthToken>('/auth/', {
    method: 'POST',
    body: credentials,
    auth: false,
  });
}

function registerNames(payload: RegisterPayload): {
  first_name: string;
  last_name: string;
} {
  const first = payload.first_name?.trim();
  const last = payload.last_name?.trim();
  if (first) {
    return { first_name: first, last_name: last || ' ' };
  }

  const local = (payload.email || payload.username).split('@')[0]?.trim();
  return {
    first_name: local || 'Usuario',
    last_name: last || 'Memora',
  };
}

/** POST `/usuario/create` — no token. Caller must login after. */
export async function createUsuario(payload: RegisterPayload): Promise<Usuario> {
  const email = (payload.email || payload.username).trim();
  const names = registerNames(payload);

  return apiRequest<Usuario>('/usuario/create', {
    method: 'POST',
    body: {
      username: payload.username.trim(),
      email,
      password: payload.password,
      first_name: names.first_name,
      last_name: names.last_name,
    },
    auth: false,
  });
}

export async function register(payload: RegisterPayload): Promise<AuthToken> {
  await createUsuario(payload);
  return login({
    username: payload.username.trim(),
    password: payload.password,
  });
}

export const authService = {
  login,
  register,
  createUsuario,
};
