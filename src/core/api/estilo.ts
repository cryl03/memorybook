import type { AlbumEstilo, FotosPorPagina } from './types';

const STYLE_IDS = new Set(['sutil', 'elegante', 'espontaneo', 'clasico']);

const STORY_ID_MAP: Record<string, string> = {
  viaje: 'viaje',
  familia: 'familia',
  cotidianos: 'cotidianos',
  special: 'special',
};

/** Local story label/id → API `story_id`. Unknown (Pareja, Amigos, Mascota) → `special`. */
export function toStoryId(story: string): string {
  const normalized = story.trim().toLowerCase();
  return STORY_ID_MAP[normalized] ?? 'special';
}

/** Local style id → API `tone_id`. Unknown → `sutil`. */
export function toToneId(style: string): string {
  const normalized = style.trim().toLowerCase();
  return STYLE_IDS.has(normalized) ? normalized : 'sutil';
}

/**
 * Maps onboarding story + style → API `estilo_default`.
 * Viaje → viaje_*; anything else → cotidianos_*.
 */
export function toEstiloDefault(story: string, style: string): AlbumEstilo {
  const tema = story.trim().toLowerCase() === 'viaje' ? 'viaje' : 'cotidianos';
  const estilo = STYLE_IDS.has(style) ? style : 'sutil';
  return `${tema}_${estilo}` as AlbumEstilo;
}

/** Parse API `estilo_default` → local story + style ids. */
export function fromEstiloDefault(estilo?: string | null): {
  story: string;
  style: string;
} {
  if (!estilo) return { story: '', style: '' };

  const match = /^(viaje|cotidianos)_(sutil|elegante|espontaneo|clasico)$/.exec(
    estilo,
  );
  if (!match) return { story: '', style: '' };

  return {
    story: match[1] === 'viaje' ? 'Viaje' : 'Familia',
    style: match[2],
  };
}

/**
 * Layout / diseño → 1–4.
 * Album field: `n_paginas` (API mislabels as "N paginas").
 * Upload field: `capacidad_fotos`.
 */
export function toFotosPorPagina(design?: number | null): FotosPorPagina {
  if (design === 1 || design === 2 || design === 3 || design === 4) {
    return design;
  }
  return 1;
}

/** Alias — upload FormData key is `capacidad_fotos`. */
export function toCapacidadFotos(design?: number | null): FotosPorPagina {
  return toFotosPorPagina(design);
}

/** Alias — album JSON key is `n_paginas` but means Diseño. */
export function toNPaginasDiseno(design?: number | null): FotosPorPagina {
  return toFotosPorPagina(design);
}

/** Prefer explicit diseño; else derive from photos-per-page preference. */
export function resolveFotosPorPagina(options?: {
  fotosPorPagina?: number | null;
  layoutPhotoCount?: number | null;
}): FotosPorPagina {
  if (options?.fotosPorPagina != null) {
    return toFotosPorPagina(options.fotosPorPagina);
  }
  return toFotosPorPagina(options?.layoutPhotoCount ?? 1);
}
