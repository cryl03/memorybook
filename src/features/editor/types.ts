// Editor types and interfaces

export type LayoutType = 'single' | 'grid-2' | 'grid-4' | 'collage' | 'full-bleed';

export type FilterType = 'none' | 'warm' | 'cool' | 'bw' | 'vintage' | 'bright';

export interface Sticker {
  id: string;
  label: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface PageText {
  content: string;
  fontSize: number;
  alignment: 'left' | 'center' | 'right';
}

export interface PageData {
  id: string;
  photos: PagePhoto[];
  layout: LayoutType;
  text: PageText;
  stickers: Sticker[];
}

export interface PagePhoto {
  uri: string;
  filter: FilterType;
  order: number;
}

/** API `FotosPorPagina` — Diseño 1–4 */
export type DisenoPagina = 1 | 2 | 3 | 4;

export const DISENOS: {
  design: DisenoPagina;
  type: LayoutType;
  label: string;
}[] = [
  { design: 1, type: 'single', label: 'Diseño 1' },
  { design: 2, type: 'grid-2', label: 'Diseño 2' },
  { design: 3, type: 'collage', label: 'Diseño 3' },
  { design: 4, type: 'grid-4', label: 'Diseño 4' },
];

/** @deprecated use DISENOS — kept for older imports */
export const LAYOUTS: { type: LayoutType; label: string }[] = DISENOS.map(d => ({
  type: d.type,
  label: d.label,
}));

export function layoutFromDiseno(design: DisenoPagina): LayoutType {
  return DISENOS.find(d => d.design === design)?.type ?? 'single';
}

export function disenoFromLayout(layout: LayoutType): DisenoPagina {
  if (layout === 'full-bleed' || layout === 'single') return 1;
  if (layout === 'grid-2') return 2;
  if (layout === 'collage') return 3;
  return 4;
}

export const FILTERS: { type: FilterType; label: string; color: string }[] = [
  { type: 'none', label: 'Original', color: 'transparent' },
  { type: 'warm', label: 'Cálido', color: 'rgba(255, 165, 0, 0.15)' },
  { type: 'cool', label: 'Frío', color: 'rgba(0, 100, 255, 0.12)' },
  { type: 'bw', label: 'B/N', color: 'rgba(0, 0, 0, 0.0)' },
  { type: 'vintage', label: 'Vintage', color: 'rgba(180, 130, 70, 0.18)' },
  { type: 'bright', label: 'Brillo', color: 'rgba(255, 255, 200, 0.15)' },
];
