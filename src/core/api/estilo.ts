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

/**
 * Upload plan for one diseño.
 * API `capacidad_fotos` and album `n_paginas` are `designs[].code`.
 * `slots` is `designs[].capacity` — photos per page, used only to size each POST.
 */
export function uploadPlanForDesign(
  definition: StyleDefinition | null | undefined,
  designCode?: number | null,
): { code: number; slots: number } {
  if (!definition) {
    const code = toNPaginasDiseno(designCode);
    return { code, slots: code };
  }
  const design = pickStyleDesign(definition, designCode);
  return {
    code: design.code,
    slots: Math.max(1, Math.floor(design.capacity) || 1),
  };
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

const STORY_PHRASE: Record<string, string> = {
  viaje: 'un viaje',
  familia: 'la familia',
  cotidianos: 'los momentos cotidianos',
  special: 'un momento especial',
  pareja: 'la pareja',
  amigos: 'los amigos',
  mascota: 'la mascota',
};

const TONE_PHRASE: Record<string, string> = {
  sutil: 'un tono sutil, fondo claro y suave',
  elegante: 'un tono elegante, fondo limpio y texto oscuro',
  espontaneo: 'un tono espontáneo, fondo cálido y composición suelta',
  clasico: 'un tono clásico, fondo neutro y texto sobrio',
};

/** Borrador de POST diseno/instruccion según historia y tono. El usuario lo edita. */
export function defaultDisenoInstruccion(story?: string, style?: string): string {
  const storyKey = (story ?? '').trim().toLowerCase();
  const storyId = toStoryId(story ?? '');
  const toneId = toToneId(style ?? '');
  const storyPhrase = storyKey
    ? (STORY_PHRASE[storyKey] ?? STORY_PHRASE[storyId] ?? 'esta historia')
    : 'esta historia';
  const tonePhrase = TONE_PHRASE[toneId] ?? 'un tono suave y un fondo limpio';
  return `Ajusta un poco el diseño y el fondo para ${storyPhrase}, con ${tonePhrase}. Conserva las fotos.`;
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
