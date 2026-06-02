import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { icons } from '@core/assets/icons';
import { colors, typography, spacing } from '@core/theme';

const { width } = Dimensions.get('window');
const COLUMNS = 4;
const GAP = 2;
const ITEM_SIZE = (width - GAP * (COLUMNS - 1)) / COLUMNS;

interface PhotoSelectorScreenProps {
  maxPhotos: number;
  onNext: (selectedPhotos: string[]) => void;
  onClose: () => void;
}

export function PhotoSelectorScreen({
  maxPhotos,
  onNext,
  onClose,
}: PhotoSelectorScreenProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

  // Placeholder photo data — in production, use CameraRoll API
  const photos = Array.from({ length: 60 }, (_, i) => ({
    id: `photo_${i}`,
    uri: '', // Placeholder
  }));

  const togglePhoto = (id: string) => {
    setSelectedPhotos(prev => {
      if (prev.includes(id)) {
        return prev.filter(p => p !== id);
      }
      if (prev.length >= maxPhotos) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const renderPhoto = ({ item }: { item: { id: string; uri: string } }) => {
    const isSelected = selectedPhotos.includes(item.id);
    const selectionIndex = selectedPhotos.indexOf(item.id);

    return (
      <TouchableOpacity
        style={styles.photoItem}
        onPress={() => togglePhoto(item.id)}
        activeOpacity={0.7}>
        <View style={styles.photoPlaceholder} />
        {isSelected && (
          <View style={styles.selectedOverlay}>
            <View style={styles.selectionBadge}>
              <Text style={styles.selectionNumber}>{selectionIndex + 1}</Text>
            </View>
          </View>
        )}
        {!isSelected && (
          <View style={styles.unselectedCircle} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={{ fontSize: 24, color: colors.text.primary }}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tu nuevo álbum</Text>
        <TouchableOpacity
          onPress={() => onNext(selectedPhotos)}
          disabled={selectedPhotos.length === 0}>
          <Text
            style={[
              styles.nextButton,
              selectedPhotos.length === 0 && styles.nextButtonDisabled,
            ]}>
            Siguiente
          </Text>
        </TouchableOpacity>
      </View>

      {/* Album selector */}
      <TouchableOpacity style={styles.albumSelector}>
        <Text style={styles.albumName}>Recientes</Text>
        <Image
          source={icons['arrow-right']}
          style={{ width: 16, height: 16, tintColor: colors.text.secondary }}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Counter */}
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>
          {selectedPhotos.length} / {maxPhotos} fotos seleccionadas
        </Text>
      </View>

      {/* Photo grid */}
      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={item => item.id}
        numColumns={COLUMNS}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  closeButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  nextButton: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  nextButtonDisabled: {
    color: colors.text.tertiary,
  },
  albumSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  albumName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  counterContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  counterText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  row: {
    gap: GAP,
    marginBottom: GAP,
  },
  photoItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    position: 'relative',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceSecondary,
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: spacing.xs,
  },
  selectionBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.blue.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionNumber: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
  },
  unselectedCircle: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.surface,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
});
