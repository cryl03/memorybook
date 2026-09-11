import { Dimensions } from 'react-native';
import { albumService } from './services/albumService';
import { toEstiloDefault } from './estilo';
import { spacing } from '@core/theme';

export type PageOrientation = 'horizontal' | 'vertical';

/** Portrait page height / width. Landscape is the inverse. */
export const PAGE_ASPECT = 1.38;

const LANDSCAPE = new Set(['horizontal', 'landscape', 'apaisado', 'paisaje']);
const PORTRAIT = new Set(['vertical', 'portrait', 'retrato']);

export function parsePageOrientation(
  value?: string | null,
): PageOrientation {
  const key = (value ?? '').trim().toLowerCase();
  if (LANDSCAPE.has(key)) return 'horizontal';
  if (PORTRAIT.has(key)) return 'vertical';
  return 'vertical';
}

export async function resolvePageOrientation(options: {
  story?: string;
  style?: string;
  estiloDefault?: string | null;
}): Promise<PageOrientation> {
  const code =
    options.estiloDefault ||
    (options.story || options.style
      ? toEstiloDefault(options.story ?? '', options.style ?? 'sutil')
      : undefined);
  if (!code) return 'vertical';

  try {
    const definition = await albumService.getStyleDefinitions(code);
    return parsePageOrientation(definition.page_orientation);
  } catch {
    return 'vertical';
  }
}

export function getAlbumBookMetrics(
  orientation: PageOrientation,
  screenWidth = Dimensions.get('window').width,
) {
  const openW = screenWidth * 0.92;
  const pageW = openW / 2;
  const isHorizontal = orientation === 'horizontal';
  const pageH = isHorizontal ? pageW / PAGE_ASPECT : pageW * PAGE_ASPECT;
  const coverW = isHorizontal ? screenWidth * 0.78 : pageW;
  const coverH = isHorizontal
    ? coverW / PAGE_ASPECT
    : screenWidth * 1.05;

  return {
    pageW,
    pageH,
    openW,
    openH: pageH,
    coverW,
    coverH,
    isHorizontal,
  };
}

export function getEditorBookMetrics(
  orientation: PageOrientation,
  screenWidth = Dimensions.get('window').width,
) {
  const contentWidth = screenWidth - spacing.xl * 2;
  const spineWidth = 3;
  const pageW = (contentWidth - spineWidth) / 2;
  const isHorizontal = orientation === 'horizontal';
  const pageH = isHorizontal ? pageW / PAGE_ASPECT : pageW * 1.48;
  const coverW = isHorizontal ? screenWidth * 0.78 : screenWidth * 0.52;
  const coverH = isHorizontal ? coverW / PAGE_ASPECT : coverW * PAGE_ASPECT;

  return {
    contentWidth,
    spineWidth,
    pageW,
    pageH,
    coverW,
    coverH,
    isHorizontal,
  };
}
