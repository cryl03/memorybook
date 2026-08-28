import type { AlbumEstilo, FotosPorPagina, StyleDefinition, StyleDesign } from './types';

const STYLE_IDS = new Set(['sutil', 'elegante', 'espontaneo', 'clasico']);
const STORY_IDS = new Set(['viaje', 'familia', 'cotidianos', 'special']);

const STORY_ID_MAP: Record<string, string> = {
  viaje: 'viaje',
  familia: 'familia',
  cotidianos: 'cotidianos',
  special: 'special',
};

/** Local story label/id → API `story_id`. Unknown → `special`. */
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
 * Maps onboarding story + tone → API `estilo_default` (`{story}_{tone}`).
 * Codes exist for viaje, familia, cotidianos, special.
 */
export function toEstiloDefault(story: string, style: string): AlbumEstilo {
  const tema = STORY_IDS.has(toStoryId(story)) ? toStoryId(story) : 'special';
  const estilo = toToneId(style);
  return `${tema}_${estilo}` as AlbumEstilo;
}

/** Parse API `estilo_default` → local story + style ids. */
export function fromEstiloDefault(estilo?: string | null): {
  story: string;
  style: string;
} {
  if (!estilo) return { story: '', style: '' };

  const match =
    /^(viaje|familia|cotidianos|special)_(sutil|elegante|espontaneo|clasico)$/.exec(
      estilo,
    );
  if (!match) return { story: '', style: '' };

  return {
    story: match[1],
    style: match[2],
  };
}

/** Album JSON `n_paginas` = design code (1–4). */
export function toNPaginasDiseno(design?: number | null): number {
  if (design === 1 || design === 2 || design === 3 || design === 4) {
    return design;
  }
  return 1;
}

/** Upload FormData `capacidad_fotos` = designs[].capacity (1–6+). */
export function toCapacidadFotos(capacity?: number | null): FotosPorPagina {
  if (typeof capacity === 'number' && Number.isFinite(capacity) && capacity >= 1) {
    return Math.min(Math.floor(capacity), 12);
  }
  return 1;
}

/** @deprecated use toCapacidadFotos for upload, toNPaginasDiseno for album. */
export function toFotosPorPagina(design?: number | null): FotosPorPagina {
  return toCapacidadFotos(design);
}

export function pickStyleDesign(
  definition: StyleDefinition,
  designCode?: number | null,
): StyleDesign {
  const wanted = designCode ?? definition.default_design;
  return (
    definition.designs.find(design => design.code === wanted) ??
    definition.designs[0] ?? {
      code: definition.default_design || 1,
      label: 'Default',
      capacity: 1,
    }
  );
}

/** Prefer explicit design code; else 1. */
export function resolveFotosPorPagina(options?: {
  fotosPorPagina?: number | null;
  layoutPhotoCount?: number | null;
}): FotosPorPagina {
  if (options?.fotosPorPagina != null) {
    return toNPaginasDiseno(options.fotosPorPagina);
  }
  return toNPaginasDiseno(options?.layoutPhotoCount ?? 1);
}
