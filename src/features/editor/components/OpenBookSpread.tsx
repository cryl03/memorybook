import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Text,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, spacing, borderRadius } from '@core/theme';
import { PageData, PagePhoto } from '../types';
import { FilteredImage } from './FilteredImage';

const { width } = Dimensions.get('window');
const CONTENT_WIDTH = width - spacing.xl * 2;
const SPINE_WIDTH = 3;
const PAGE_WIDTH = (CONTENT_WIDTH - SPINE_WIDTH) / 2;
const PAGE_HEIGHT = PAGE_WIDTH * 1.48;
const PHOTO_GAP = 8;
const PAGE_PADDING = 14;

interface OpenBookSpreadProps {
  leftPage?: PageData;
  rightPage?: PageData;
  leftPageIndex: number;
  rightPageIndex: number;
  activePageIndex: number;
  onPhotoPress: (pageIndex: number, photoIndex: number) => void;
  onEmptyPagePress?: (pageIndex: number) => void;
}

const COVER_WIDTH = width * 0.52;
const COVER_HEIGHT = COVER_WIDTH * 1.38;

interface ClosedBookCoverProps {
  page?: PageData;
  fallbackCoverPhoto?: string;
  onPhotoPress?: () => void;
}

/** Portada: libro cerrado (una sola tapa), como Figma. */
export function ClosedBookCover({
  page,
  fallbackCoverPhoto,
  onPhotoPress,
}: ClosedBookCoverProps) {
  const coverPhoto = page?.photos[0]?.uri || fallbackCoverPhoto;
  const textContent = page?.text.content || '';

  return (
    <View style={styles.coverContainer}>
      <View style={styles.closedBook}>
        <LinearGradient
          colors={['#C5D9E8', '#A8C4D9', '#8FB0C9']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
        {/* Lomo sutil al borde izquierdo */}
        <LinearGradient
          colors={['rgba(0,0,0,0.12)', 'rgba(0,0,0,0.04)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.coverSpineEdge}
        />
        <View style={styles.closedBookInner}>
          <TouchableOpacity
            style={styles.closedCoverPhotoFrame}
            onPress={onPhotoPress}
            activeOpacity={0.9}
            disabled={!onPhotoPress}>
            {coverPhoto ? (
              <Image
                source={{ uri: coverPhoto }}
                style={styles.photoImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.coverPhotoPlaceholder} />
            )}
          </TouchableOpacity>

          <View style={[styles.closedCoverTextBox, textContent ? styles.closedCoverTextSelected : null]}>
            {textContent ? (
              <Text style={styles.closedCoverText} numberOfLines={3}>
                {textContent}
              </Text>
            ) : (
              <View style={styles.closedCoverTextEmpty} />
            )}
            {textContent ? (
              <>
                <View style={[styles.selectionHandle, styles.handleTL]} />
                <View style={[styles.selectionHandle, styles.handleTR]} />
                <View style={[styles.selectionHandle, styles.handleBL]} />
                <View style={[styles.selectionHandle, styles.handleBR]} />
              </>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

function renderPagePhotos(
  page: PageData | undefined,
  pageIndex: number,
  onPhotoPress: (pageIndex: number, photoIndex: number) => void,
  onEmptyPagePress?: (pageIndex: number) => void,
) {
  if (!page || page.photos.length === 0) {
    return (
      <TouchableOpacity
        style={styles.emptyPageContent}
        onPress={() => onEmptyPagePress?.(pageIndex)}
        activeOpacity={0.85}
        disabled={!onEmptyPagePress}
        accessibilityLabel="Página sin fotos. Toca para agregar."
        accessibilityRole="button">
        <Text style={styles.emptyPageText}>Sin fotos</Text>
        {onEmptyPagePress ? (
          <Text style={styles.emptyPageHint}>Toca para agregar fotos</Text>
        ) : null}
      </TouchableOpacity>
    );
  }

  const pagePhotos = page.photos;
  const layout = page.layout;

  const maxForLayout =
    layout === 'single' || layout === 'full-bleed'
      ? 1
      : layout === 'grid-2'
        ? 2
        : layout === 'collage'
          ? 3
          : layout === 'grid-4'
            ? 4
            : pagePhotos.length;

  const visiblePhotos = pagePhotos.slice(0, Math.max(maxForLayout, 1));
  const visibleCount = visiblePhotos.length;

  const renderPhoto = (photo: PagePhoto, photoIndex: number, containerStyle: object) => {
    return (
      <TouchableOpacity
        key={`${photo.uri}-${photoIndex}`}
        style={containerStyle}
        onPress={() => onPhotoPress(pageIndex, photoIndex)}
        activeOpacity={0.85}
        accessibilityLabel={`Foto ${photoIndex + 1}. Toca para opciones.`}
        accessibilityRole="button">
        <FilteredImage
          uri={photo.uri}
          filter={photo.filter}
          style={styles.photoImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  };

  // Prefer explicit page.layout (Diseño 1–4); fall back to photo count
  if (layout === 'single' || layout === 'full-bleed' || (!layout && visibleCount === 1)) {
    return (
      <View style={styles.singlePhotoLayout}>
        {renderPhoto(visiblePhotos[0], 0, styles.singlePhoto)}
      </View>
    );
  }

  if (layout === 'grid-2' || (!layout && visibleCount === 2)) {
    return (
      <View style={styles.stackedLayout}>
        {visiblePhotos.slice(0, 2).map((photo, i) =>
          renderPhoto(photo, i, styles.stackedPhoto),
        )}
      </View>
    );
  }

  if (layout === 'collage' || (!layout && visibleCount === 3)) {
    const rightPhotos = visiblePhotos.slice(1, 3);
    const emptyRightSlots = Math.max(0, 2 - rightPhotos.length);

    return (
      <View style={styles.collageLayout}>
        <View style={styles.collageLeftCol}>
          {renderPhoto(visiblePhotos[0], 0, styles.collagePhoto)}
        </View>
        <View style={styles.collageRightCol}>
          {rightPhotos.map((photo, i) => (
            <View key={`${photo.uri}-r${i + 1}`} style={styles.collageRightSlot}>
              {renderPhoto(photo, i + 1, styles.collagePhoto)}
            </View>
          ))}
          {Array.from({ length: emptyRightSlots }).map((_, i) => (
            <View
              key={`empty-r-${i}`}
              style={[styles.collageRightSlot, styles.collageEmptySlot]}
            />
          ))}
        </View>
      </View>
    );
  }

  const rows: PagePhoto[][] = [];
  for (let i = 0; i < visiblePhotos.length; i += 2) {
    rows.push(visiblePhotos.slice(i, i + 2));
  }

  return (
    <View style={styles.gridLayout}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.gridRow}>
          {row.map((photo, i) => {
            const photoIndex = rowIndex * 2 + i;
            return renderPhoto(photo, photoIndex, styles.gridPhoto);
          })}
        </View>
      ))}
    </View>
  );
}

function BookPage({
  page,
  pageIndex,
  side,
  isActive,
  blank,
  onPhotoPress,
  onEmptyPagePress,
}: {
  page?: PageData;
  pageIndex: number;
  side: 'left' | 'right';
  isActive: boolean;
  /** Endpaper / unpaired side — no empty CTA, no selection chrome */
  blank?: boolean;
  onPhotoPress: (pageIndex: number, photoIndex: number) => void;
  onEmptyPagePress?: (pageIndex: number) => void;
}) {
  return (
    <View
      style={[
        styles.bookPage,
        side === 'left' ? styles.bookPageLeft : styles.bookPageRight,
        side === 'left' ? styles.bookPageShadowLeft : styles.bookPageShadowRight,
        isActive && !blank && styles.bookPageActive,
        blank && styles.bookPageBlank,
      ]}>
      <View style={styles.pageInner}>
        {blank ? (
          <View style={styles.blankPageContent} />
        ) : (
          renderPagePhotos(page, pageIndex, onPhotoPress, onEmptyPagePress)
        )}
      </View>
    </View>
  );
}

export function OpenBookSpread({
  leftPage,
  rightPage,
  leftPageIndex,
  rightPageIndex,
  activePageIndex,
  onPhotoPress,
  onEmptyPagePress,
}: OpenBookSpreadProps) {
  const hasRightPage = rightPageIndex > leftPageIndex && rightPage != null;

  return (
    <View style={styles.spreadContainer}>
      <View style={styles.spread}>
        <BookPage
          page={leftPage}
          pageIndex={leftPageIndex}
          side="left"
          isActive={activePageIndex === leftPageIndex}
          onPhotoPress={onPhotoPress}
          onEmptyPagePress={onEmptyPagePress}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.07)', 'rgba(0,0,0,0.02)', 'rgba(0,0,0,0.07)']}
          locations={[0, 0.5, 1]}
          style={styles.spine}
        />
        <BookPage
          page={hasRightPage ? rightPage : undefined}
          pageIndex={hasRightPage ? rightPageIndex : -1}
          side="right"
          isActive={hasRightPage && activePageIndex === rightPageIndex}
          blank={!hasRightPage}
          onPhotoPress={onPhotoPress}
          onEmptyPagePress={onEmptyPagePress}
        />
      </View>
    </View>
  );
}

export { PAGE_WIDTH, PAGE_HEIGHT, CONTENT_WIDTH };

const styles = StyleSheet.create({
  // —— Portada (libro cerrado) ——
  coverContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.md,
  },
  closedBook: {
    width: COVER_WIDTH,
    height: COVER_HEIGHT,
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 10,
  },
  coverSpineEdge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 14,
    zIndex: 1,
  },
  closedBookInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: COVER_HEIGHT * 0.14,
    paddingBottom: COVER_HEIGHT * 0.16,
    gap: spacing.lg,
  },
  closedCoverPhotoFrame: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  closedCoverTextBox: {
    width: '62%',
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  closedCoverTextSelected: {
    borderWidth: 1.5,
    borderColor: '#4A90D9',
  },
  closedCoverText: {
    fontSize: 11,
    color: colors.text.primary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 15,
  },
  closedCoverTextEmpty: {
    width: '100%',
    height: 36,
    borderWidth: 1.5,
    borderColor: '#7BA3C2',
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  selectionHandle: {
    position: 'absolute',
    width: 7,
    height: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#4A90D9',
  },
  handleTL: { top: -3.5, left: -3.5 },
  handleTR: { top: -3.5, right: -3.5 },
  handleBL: { bottom: -3.5, left: -3.5 },
  handleBR: { bottom: -3.5, right: -3.5 },

  // —— Spread (páginas interiores) ——
  spreadContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.sm,
  },
  spread: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  spine: {
    width: SPINE_WIDTH,
    alignSelf: 'stretch',
  },
  bookPage: {
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
  },
  bookPageLeft: {
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
    borderRightWidth: 0,
  },
  bookPageRight: {
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    borderLeftWidth: 0,
  },
  bookPageShadowLeft: {
    shadowColor: '#000',
    shadowOffset: { width: -3, height: 5 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 5,
  },
  bookPageShadowRight: {
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 5 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 5,
  },
  bookPageActive: {
    borderWidth: 1.5,
    borderColor: '#4A90D9',
    zIndex: 1,
  },
  bookPageBlank: {
    backgroundColor: '#FAFAFA',
  },
  pageInner: {
    flex: 1,
    padding: PAGE_PADDING,
  },
  blankPageContent: {
    flex: 1,
  },
  coverPhotoPlaceholder: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  filterOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  bwOverlay: {
    backgroundColor: 'rgba(128, 128, 128, 0.45)',
  },
  emptyPageContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 2,
    gap: 6,
  },
  emptyPageText: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  emptyPageHint: {
    fontSize: 10,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  singlePhotoLayout: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  singlePhoto: {
    width: '70%',
    aspectRatio: 1,
    borderRadius: 1,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSecondary,
  },
  stackedLayout: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: PHOTO_GAP,
    paddingVertical: spacing.sm,
  },
  stackedPhoto: {
    width: '86%',
    aspectRatio: 1.38,
    borderRadius: 1,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSecondary,
  },
  collageLayout: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: PHOTO_GAP,
  },
  collageLeftCol: {
    flex: 1,
    minWidth: 0,
  },
  collageRightCol: {
    flex: 1,
    minWidth: 0,
    gap: PHOTO_GAP,
  },
  collageRightSlot: {
    flex: 1,
    minHeight: 0,
  },
  collagePhoto: {
    flex: 1,
    borderRadius: 1,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSecondary,
  },
  collageEmptySlot: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 1,
  },
  collageBig: {
    flex: 1,
    borderRadius: 1,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSecondary,
  },
  collageSmall: {
    flex: 1,
    borderRadius: 1,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSecondary,
  },
  gridLayout: {
    flex: 1,
    gap: PHOTO_GAP,
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  gridRow: {
    flexDirection: 'row',
    gap: PHOTO_GAP,
    flex: 1,
  },
  gridPhoto: {
    flex: 1,
    borderRadius: 1,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSecondary,
  },
});
