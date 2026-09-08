import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Text,
} from 'react-native';
import { colors, spacing, borderRadius } from '@core/theme';
import { LayoutType, PagePhoto } from '../types';
import { FilteredImage } from './FilteredImage';

const { width } = Dimensions.get('window');
const GRID_WIDTH = width - spacing.xl * 2;

interface PhotoGridProps {
  photos: PagePhoto[];
  layout: LayoutType;
  onPhotoPress: (index: number) => void;
  onPhotoLongPress: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export function PhotoGrid({
  photos,
  layout,
  onPhotoPress,
  onPhotoLongPress,
}: PhotoGridProps) {
  const renderPhoto = (photo: PagePhoto, index: number, photoStyle: any) => (
    <TouchableOpacity
      key={`${photo.uri}-${index}`}
      style={photoStyle}
      onPress={() => onPhotoPress(index)}
      onLongPress={() => onPhotoLongPress(index)}
      activeOpacity={0.8}
      accessibilityLabel={`Foto ${index + 1}. Mantén presionado para opciones.`}
      accessibilityRole="button">
      <FilteredImage
        uri={photo.uri}
        filter={photo.filter}
        style={styles.image}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  const renderEmpty = (style: any, index: number) => (
    <TouchableOpacity
      key={`empty-${index}`}
      style={[style, styles.emptySlot]}
      onPress={() => onPhotoPress(index)}
      accessibilityLabel="Agregar foto"
      accessibilityRole="button">
      <Text style={styles.emptyText}>+</Text>
    </TouchableOpacity>
  );

  const renderLayout = () => {
    switch (layout) {
      case 'single':
      case 'full-bleed':
        return (
          <View style={[styles.singleContainer, layout === 'full-bleed' && styles.fullBleed]}>
            {photos[0]
              ? renderPhoto(photos[0], 0, styles.singlePhoto)
              : renderEmpty(styles.singlePhoto, 0)}
          </View>
        );

      case 'grid-2':
        return (
          <View style={styles.grid2Container}>
            {[0, 1].map(i =>
              photos[i]
                ? renderPhoto(photos[i], i, styles.grid2Photo)
                : renderEmpty(styles.grid2Photo, i),
            )}
          </View>
        );

      case 'grid-4':
        return (
          <View style={styles.grid4Container}>
            {[0, 1, 2, 3].map(i =>
              photos[i]
                ? renderPhoto(photos[i], i, styles.grid4Photo)
                : renderEmpty(styles.grid4Photo, i),
            )}
          </View>
        );

      case 'collage':
        return (
          <View style={styles.collageContainer}>
            <View style={styles.collageLeft}>
              {photos[0]
                ? renderPhoto(photos[0], 0, styles.collageBig)
                : renderEmpty(styles.collageBig, 0)}
            </View>
            <View style={styles.collageRight}>
              {[1, 2].map(i =>
                photos[i]
                  ? renderPhoto(photos[i], i, styles.collageSmall)
                  : renderEmpty(styles.collageSmall, i),
              )}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return <View style={styles.container}>{renderLayout()}</View>;
}

const photoBase = {
  borderRadius: borderRadius.md,
  overflow: 'hidden' as const,
  backgroundColor: colors.surfaceSecondary,
};

const styles = StyleSheet.create({
  container: {
    width: GRID_WIDTH,
    alignSelf: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  filterOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  emptySlot: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 24,
    color: colors.text.tertiary,
  },
  // Single layout
  singleContainer: {
    height: GRID_WIDTH * 0.85,
  },
  singlePhoto: {
    ...photoBase,
    width: '100%',
    height: '100%',
  },
  fullBleed: {
    borderRadius: 0,
  },
  // Grid 2
  grid2Container: {
    flexDirection: 'row',
    gap: spacing.sm,
    height: GRID_WIDTH * 0.75,
  },
  grid2Photo: {
    ...photoBase,
    flex: 1,
    height: '100%',
  },
  // Grid 4
  grid4Container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  grid4Photo: {
    ...photoBase,
    width: (GRID_WIDTH - spacing.sm) / 2,
    height: (GRID_WIDTH - spacing.sm) / 2,
  },
  // Collage — Diseño 3: 1 grande izq + 2 apiladas der (columnas 50/50)
  collageContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    height: GRID_WIDTH * 0.85,
  },
  collageLeft: {
    flex: 1,
  },
  collageRight: {
    flex: 1,
    gap: spacing.sm,
  },
  collageBig: {
    ...photoBase,
    width: '100%',
    height: '100%',
  },
  collageSmall: {
    ...photoBase,
    width: '100%',
    flex: 1,
  },
});
