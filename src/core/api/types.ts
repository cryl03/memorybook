export interface AuthCredentials {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  email?: string;
}

export interface AuthToken {
  username?: string;
  password?: string;
  token: string;
}

export interface Foto {
  unique_id?: string;
  album?: string;
  album_id: string;
  imagen?: string;
  descripcion?: string | null;
  fecha_creacion?: string;
  fecha_modificacion?: string;
}

export interface Album {
  unique_id?: string;
  nombre: string;
  descripcion?: string | null;
  fecha_creacion?: string;
  fecha_modificacion?: string;
  fotos?: Foto[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CreateAlbumPayload {
  nombre: string;
  descripcion?: string | null;
}

export interface UpdateAlbumPayload {
  nombre?: string;
  descripcion?: string | null;
}

export interface UploadFotoPayload {
  album_id: string;
  uri: string;
  descripcion?: string | null;
  fileName?: string;
  mimeType?: string;
}
