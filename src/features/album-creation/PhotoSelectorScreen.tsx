import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { icons } from '@core/assets/icons';
import { colors, typography, spacing } from '@core/theme';

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

async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const version = Platform.Version;
    if (version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
  }
  return true; // iOS handles permissions via Info.plist
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
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    const granted = await requestPermission();
    if (!granted) {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos acceso a tu galería para seleccionar fotos.',
      );
      return;
    }
    setHasPermission(true);
    fetchPhotos();
  };

  const fetchPhotos = async (after?: string) => {
    try {
      const result = await CameraRoll.getPhotos({
        first: 60,
        after,
        assetType: 'Photos',
        include: ['filename'],
      });

      const newPhotos: GalleryPhoto[] = result.edges.map((edge, index) => ({
        id: edge.node.image.uri,
        uri: edge.node.image.uri,
      }));

      if (after) {
        setPhotos(prev => [...prev, ...newPhotos]);
      } else {
        setPhotos(newPhotos);
      }

      setEndCursor(result.page_info.end_cursor);
      setHasMore(result.page_info.has_next_page);
    } catch (error) {
      console.warn('Error loading photos:', error);
    }
  };

  const loadMore = () => {
    if (hasMore && endCursor) {
      fetchPhotos(endCursor);
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
      {/* Header */}
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
          {isAppendMode
            ? `${selectedPhotos.length} / ${maxPhotos} fotos nuevas`
            : `${selectedPhotos.length} / ${maxPhotos} fotos seleccionadas`}
        </Text>
      </View>

      {/* Photo grid */}
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
