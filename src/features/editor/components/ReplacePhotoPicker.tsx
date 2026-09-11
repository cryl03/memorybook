import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { icons } from '@core/assets/icons';
import { colors, typography, spacing, borderRadius } from '@core/theme';
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
const COLUMNS = 3;
const GAP = 4;
const HORIZONTAL_PAD = spacing.xl * 2;
const ITEM_SIZE = (width - HORIZONTAL_PAD - GAP * (COLUMNS - 1)) / COLUMNS;

interface ReplacePhotoPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (uris: string[]) => void;
  maxSelect?: number;
  title?: string;
  confirmLabel?: string;
  permissionMessage?: string;
}

interface GalleryPhoto {
  id: string;
  uri: string;
}

export function ReplacePhotoPicker({
  visible,
  onClose,
  onSelect,
  maxSelect = 1,
  title = 'Reemplazar foto',
  confirmLabel = 'Usar',
  permissionMessage = 'Necesitamos acceso a tu galería para elegir fotos.',
}: ReplacePhotoPickerProps) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [endCursor, setEndCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [selectedUris, setSelectedUris] = useState<string[]>([]);
  const [limitedAccess, setLimitedAccess] = useState(false);
  const [albums, setAlbums] = useState<GalleryAlbumOption[]>([RECENTS_ALBUM]);
  const [selectedAlbum, setSelectedAlbum] = useState<GalleryAlbumOption>(RECENTS_ALBUM);
  const [albumPickerOpen, setAlbumPickerOpen] = useState(false);
  const selectedAlbumRef = useRef(selectedAlbum);
  selectedAlbumRef.current = selectedAlbum;

  const fetchPhotos = useCallback(async (after?: string, album = selectedAlbumRef.current) => {
    try {
      const result = await CameraRoll.getPhotos(buildGetPhotosParams(album, after, 48));
      if (result.limited) {
        setLimitedAccess(true);
      }

      const next: GalleryPhoto[] = result.edges.map(edge => ({
        id: edge.node.id || edge.node.image.uri,
        uri: edge.node.image.uri,
      }));

      setPhotos(prev => {
        if (!after) return next;
        const seen = new Set(prev.map(p => p.id));
        return [...prev, ...next.filter(p => !seen.has(p.id))];
      });
      setEndCursor(result.page_info.end_cursor);
      setHasMore(result.page_info.has_next_page);
    } catch (error) {
      console.warn('Error loading gallery:', error);
      Alert.alert('Error', 'No se pudieron cargar las fotos de la galería.');
    }
  }, []);

  const loadLibrary = useCallback(async () => {
    setIsLoading(true);
    const { granted, limited } = await requestPhotoLibraryAccess();
    if (!granted) {
      Alert.alert('Permiso requerido', permissionMessage);
      setIsLoading(false);
      onClose();
      return;
    }

    setLimitedAccess(limited);
    const nextAlbums = await loadGalleryAlbums();
    setAlbums(nextAlbums);
    await fetchPhotos(undefined, selectedAlbumRef.current);
    setIsLoading(false);
  }, [fetchPhotos, onClose, permissionMessage]);

  useEffect(() => {
    if (!visible) {
      setSelectedUris([]);
      setSelectedAlbum(RECENTS_ALBUM);
      setAlbumPickerOpen(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      await loadLibrary();
      if (cancelled) return;
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [visible, loadLibrary]);

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
      'iOS solo muestra las fotos que elegiste. Para ver Cámara y tus carpetas, permite todas las fotos o elige más.',
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

  const toggleUri = (uri: string) => {
    setSelectedUris(prev => {
      if (prev.includes(uri)) {
        return prev.filter(item => item !== uri);
      }
      if (maxSelect === 1) {
        return [uri];
      }
      if (prev.length >= maxSelect) {
        Alert.alert(
          'Límite',
          `Puedes elegir hasta ${maxSelect} foto${maxSelect === 1 ? '' : 's'}.`,
        );
        return prev;
      }
      return [...prev, uri];
    });
  };

  const handleConfirm = () => {
    if (selectedUris.length === 0) return;
    onSelect(selectedUris);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Cancelar</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>{title}</Text>
            {maxSelect > 1 ? (
              <Text style={styles.subtitle}>
                {selectedUris.length}/{maxSelect}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity onPress={handleConfirm} disabled={selectedUris.length === 0}>
            <Text
              style={[
                styles.confirm,
                selectedUris.length === 0 && styles.confirmDisabled,
              ]}>
              {confirmLabel}
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
            style={{ width: 14, height: 14, tintColor: colors.text.secondary }}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {limitedAccess ? (
          <TouchableOpacity style={styles.limitedBanner} onPress={handleLimitedAccess}>
            <Text style={styles.limitedText}>
              Solo ves algunas fotos. Toca para elegir Cámara y tus carpetas.
            </Text>
          </TouchableOpacity>
        ) : null}

        {isLoading && photos.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.text.primary} />
          </View>
        ) : (
          <FlatList
            data={photos}
            keyExtractor={item => item.id}
            numColumns={COLUMNS}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.list}
            onEndReached={() => {
              if (hasMore && endCursor) void fetchPhotos(endCursor);
            }}
            onEndReachedThreshold={0.4}
            renderItem={({ item }) => {
              const selected = selectedUris.includes(item.uri);
              return (
                <TouchableOpacity
                  style={[styles.item, selected && styles.itemSelected]}
                  onPress={() => toggleUri(item.uri)}
                  activeOpacity={0.85}>
                  <Image source={{ uri: item.uri }} style={styles.image} resizeMode="cover" />
                  {selected ? (
                    <View style={styles.check}>
                      <Text style={styles.checkText}>✓</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            }}
          />
        )}

        <AlbumPickerModal
          visible={albumPickerOpen}
          albums={albums}
          selectedId={selectedAlbum.id}
          onSelect={handleSelectAlbum}
          onClose={() => setAlbumPickerOpen(false)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  cancel: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  confirm: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  confirmDisabled: {
    color: colors.text.tertiary,
  },
  albumSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  albumName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  limitedBanner: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent.peach,
  },
  limitedText: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  row: {
    gap: GAP,
    marginBottom: GAP,
  },
  item: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSecondary,
  },
  itemSelected: {
    borderWidth: 2,
    borderColor: colors.text.primary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  check: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.text.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: typography.weights.bold,
  },
});
