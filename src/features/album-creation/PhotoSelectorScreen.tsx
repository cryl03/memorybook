import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { icons } from '@core/assets/icons';
import { colors, typography, spacing } from '@core/theme';
import { AlbumPickerModal } from '@core/gallery/AlbumPickerModal';
import {
  RECENTS_ALBUM,
  buildGetPhotosParams,
  loadGalleryAlbums,
  openPhotoSettings,
  refreshLimitedPhotoSelection,
  requestPhotoLibraryAccess,
  type GalleryAlbumOption,
} from '@core/gallery/photoLibrary';

const { width } = Dimensions.get('window');
const COLUMNS = 4;
const GAP = 2;
const ITEM_SIZE = (width - GAP * (COLUMNS - 1)) / COLUMNS;

interface PhotoSelectorScreenProps {
  maxPhotos: number;
  existingPhotos?: string[];
  onNext: (selectedPhotos: string[]) => void | Promise<void>;
  onClose: () => void;
}

interface GalleryPhoto {
  id: string;
  uri: string;
}

export function PhotoSelectorScreen({
  maxPhotos,
  existingPhotos = [],
  onNext,
  onClose,
}: PhotoSelectorScreenProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [hasPermission, setHasPermission] = useState(false);
  const [limitedAccess, setLimitedAccess] = useState(false);
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [albums, setAlbums] = useState<GalleryAlbumOption[]>([RECENTS_ALBUM]);
  const [selectedAlbum, setSelectedAlbum] = useState<GalleryAlbumOption>(RECENTS_ALBUM);
  const [albumPickerOpen, setAlbumPickerOpen] = useState(false);
  const selectedAlbumRef = useRef(selectedAlbum);
  selectedAlbumRef.current = selectedAlbum;

  const fetchPhotos = useCallback(async (after?: string, album = selectedAlbumRef.current) => {
    try {
      const result = await CameraRoll.getPhotos(buildGetPhotosParams(album, after));
      if (result.limited) {
        setLimitedAccess(true);
      }

      const newPhotos: GalleryPhoto[] = result.edges.map(edge => ({
        id: edge.node.id || edge.node.image.uri,
        uri: edge.node.image.uri,
      }));

      if (after) {
        setPhotos(prev => {
          const seen = new Set(prev.map(p => p.id));
          return [...prev, ...newPhotos.filter(p => !seen.has(p.id))];
        });
      } else {
        setPhotos(newPhotos);
      }

      setEndCursor(result.page_info.end_cursor);
      setHasMore(result.page_info.has_next_page);
    } catch (error) {
      console.warn('Error loading photos:', error);
    }
  }, []);

  const loadLibrary = useCallback(async () => {
    const { granted, limited } = await requestPhotoLibraryAccess();
    if (!granted) {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos acceso a tu galería para seleccionar fotos.',
      );
      return;
    }
    setHasPermission(true);
    setLimitedAccess(limited);
    const nextAlbums = await loadGalleryAlbums();
    setAlbums(nextAlbums);
    await fetchPhotos(undefined, selectedAlbumRef.current);
  }, [fetchPhotos]);

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

  const handleSelectAlbum = (album: GalleryAlbumOption) => {
    setSelectedAlbum(album);
    setAlbumPickerOpen(false);
    setPhotos([]);
    setEndCursor(undefined);
    setHasMore(true);
    void fetchPhotos(undefined, album);
  };

  const handleLimitedAccess = () => {
    Alert.alert(
      'Acceso limitado a fotos',
      'iOS solo muestra las fotos que elegiste (WhatsApp, capturas). Para ver Cámara y tus carpetas, permite todas las fotos o elige más.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Elegir más fotos',
          onPress: () => {
            void (async () => {
              await refreshLimitedPhotoSelection();
              await loadLibrary();
            })();
          },
        },
        { text: 'Abrir Ajustes', onPress: openPhotoSettings },
      ],
    );
  };

  const loadMore = () => {
    if (hasMore && endCursor) {
      void fetchPhotos(endCursor);
    }
  };

  const isAppendMode = existingPhotos.length > 0;
  const existingSet = new Set(existingPhotos);

  const togglePhoto = (uri: string) => {
    if (existingSet.has(uri)) return;

    setSelectedPhotos(prev => {
      if (prev.includes(uri)) {
        return prev.filter(p => p !== uri);
      }
      if (prev.length >= maxPhotos) {
        return prev;
      }
      return [...prev, uri];
    });
  };

  const renderPhoto = ({ item }: { item: GalleryPhoto }) => {
    const alreadyInAlbum = existingSet.has(item.uri);
    const isSelected = selectedPhotos.includes(item.uri);
    const selectionIndex = selectedPhotos.indexOf(item.uri);

    return (
      <TouchableOpacity
        style={styles.photoItem}
        onPress={() => togglePhoto(item.uri)}
        activeOpacity={alreadyInAlbum ? 1 : 0.7}
        disabled={alreadyInAlbum}>
        <Image
          source={{ uri: item.uri }}
          style={[styles.photoImage, alreadyInAlbum && styles.photoImageDisabled]}
        />
        {alreadyInAlbum ? (
          <View style={styles.alreadyAddedOverlay}>
            <Text style={styles.alreadyAddedText}>✓</Text>
          </View>
        ) : isSelected ? (
          <View style={styles.selectedOverlay}>
            <View style={styles.selectionBadge}>
              <Text style={styles.selectionNumber}>{selectionIndex + 1}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.unselectedCircle} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={{ fontSize: 24, color: colors.text.primary }}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isAppendMode ? 'Agregar fotos' : 'Tu nuevo álbum'}
        </Text>
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

      <TouchableOpacity
        style={styles.albumSelector}
        onPress={() => setAlbumPickerOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Álbum ${selectedAlbum.title}. Toca para cambiar`}>
        <Text style={styles.albumName}>{selectedAlbum.title}</Text>
        <Image
          source={icons['arrow-down']}
          style={{
            width: 16,
            height: 16,
            tintColor: colors.text.secondary,
            transform: [{ rotate: albumPickerOpen ? '180deg' : '0deg' }],
          }}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {limitedAccess ? (
        <TouchableOpacity style={styles.limitedBanner} onPress={handleLimitedAccess}>
          <Text style={styles.limitedText}>
            Solo ves algunas fotos. Toca para elegir Cámara y tus carpetas, o
            permitir acceso completo.
          </Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>
          {isAppendMode
            ? `${selectedPhotos.length} / ${maxPhotos} fotos nuevas`
            : `${selectedPhotos.length} / ${maxPhotos} fotos seleccionadas`}
        </Text>
      </View>

      {hasPermission ? (
        <FlatList
          data={photos}
          renderItem={renderPhoto}
          keyExtractor={item => item.id}
          numColumns={COLUMNS}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Permite el acceso a tu galería para seleccionar fotos
          </Text>
        </View>
      )}

      <AlbumPickerModal
        visible={albumPickerOpen}
        albums={albums}
        selectedId={selectedAlbum.id}
        onSelect={handleSelectAlbum}
        onClose={() => setAlbumPickerOpen(false)}
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
  limitedBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    backgroundColor: colors.accent.peach,
  },
  limitedText: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
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
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoImageDisabled: {
    opacity: 0.45,
  },
  alreadyAddedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alreadyAddedText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
