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

/** Backend `Estilo` TextChoices */
export type AlbumEstilo =
  | 'viaje_sutil'
  | 'viaje_elegante'
  | 'viaje_espontaneo'
  | 'viaje_clasico'
  | 'cotidianos_sutil'
  | 'cotidianos_elegante'
  | 'cotidianos_espontaneo'
  | 'cotidianos_clasico';

/** Backend album `n_paginas` IntegerChoices — Diseño 1–4 (nombre engañoso) */
export type FotosPorPagina = 1 | 2 | 3 | 4;

/** @deprecated alias — same as FotosPorPagina / API `n_paginas` design */
export type DisenoAlbum = FotosPorPagina;

export interface Foto {
  unique_id?: string;
  album?: string | { unique_id?: string; nombre?: string };
  album_id?: string;
  imagen?: string;
  descripcion?: string | null;
  /** Diseño 1–4 on upload FormData (not always echoed in response) */
  capacidad_fotos?: FotosPorPagina | number | null;
  asignada?: boolean;
  fecha_creacion?: string;
  fecha_modificacion?: string;
}

export interface Album {
  unique_id?: string;
  nombre: string;
  descripcion?: string | null;
  estilo_default?: AlbumEstilo | string | null;
  /** Diseño 1–4 (API label "N paginas" — NOT page count) */
  n_paginas?: FotosPorPagina | number | null;
  portada_fondo?: string | null;
  paginas_total?: number | null;
  fecha_creacion?: string;
  fecha_modificacion?: string;
  fotos?: Foto[];
  /** Generated album PDF URL when backend stores the file */
  pdf?: string | null;
}

/** GET `/album/:id/paginas/:n/` */
export interface AlbumPagina {
  unique_id?: string;
  numero?: number;
  n_paginas?: number;
  capacidad_fotos?: FotosPorPagina | number | null;
  estilo?: string | null;
  estilo_efectivo?: string | null;
  diseno_efectivo?: FotosPorPagina | number | null;
  admite_texto?: boolean;
  diseno_metadata?: unknown;
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
  estilo_default?: AlbumEstilo | string;
  /** Diseño 1–4 */
  n_paginas?: FotosPorPagina | number;
}

export interface UpdateAlbumPayload {
  nombre?: string;
  descripcion?: string | null;
  estilo_default?: AlbumEstilo | string;
  /** Diseño 1–4 */
  n_paginas?: FotosPorPagina | number;
}

export interface UploadFotoPayload {
  album_id: string;
  uri: string;
  descripcion?: string | null;
  /** Diseño 1–4 → form field `capacidad_fotos` */
  capacidad_fotos?: FotosPorPagina | number | null;
  fileName?: string;
  mimeType?: string;
}

/** GET `/album/style-selector` option */
export interface StyleSelectorOption {
  id: string;
  label: string;
}

/** GET `/album/style-selector` question (`story` | `tone`) */
export interface StyleSelectorQuestion {
  id: 'story' | 'tone' | string;
  question: string;
  options: StyleSelectorOption[];
}

export interface StyleSelectorResponse {
  questions: StyleSelectorQuestion[];
}

/** POST `/album/style-selector` FormData fields */
export interface SubmitStyleSelectorPayload {
  album_id: string;
  story_id: string;
  tone_id: string;
}

export interface AlbumPdfResult {
  uri: string;
}
