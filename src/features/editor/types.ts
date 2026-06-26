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

export const LAYOUTS: { type: LayoutType; label: string }[] = [
  { type: 'single', label: '1 foto' },
  { type: 'grid-2', label: '2 fotos' },
  { type: 'grid-4', label: '4 fotos' },
  { type: 'collage', label: 'Collage' },
  { type: 'full-bleed', label: 'Sin borde' },
];

export const FILTERS: { type: FilterType; label: string; color: string }[] = [
  { type: 'none', label: 'Original', color: 'transparent' },
  { type: 'warm', label: 'Cálido', color: 'rgba(255, 165, 0, 0.15)' },
  { type: 'cool', label: 'Frío', color: 'rgba(0, 100, 255, 0.12)' },
  { type: 'bw', label: 'B/N', color: 'rgba(0, 0, 0, 0.0)' },
  { type: 'vintage', label: 'Vintage', color: 'rgba(180, 130, 70, 0.18)' },
  { type: 'bright', label: 'Brillo', color: 'rgba(255, 255, 200, 0.15)' },
];
