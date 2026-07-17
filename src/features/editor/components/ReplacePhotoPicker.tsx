import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  PermissionsAndroid,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { colors, typography, spacing, borderRadius } from '@core/theme';

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

async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const version = Number(Platform.Version);
    if (version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
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

  const fetchPhotos = useCallback(async (after?: string) => {
    try {
      const result = await CameraRoll.getPhotos({
        first: 48,
        after,
        assetType: 'Photos',
      });

      const next: GalleryPhoto[] = result.edges.map(edge => ({
        id: edge.node.image.uri,
        uri: edge.node.image.uri,
      }));

      setPhotos(prev => (after ? [...prev, ...next] : next));
      setEndCursor(result.page_info.end_cursor);
      setHasMore(result.page_info.has_next_page);
    } catch (error) {
      console.warn('Error loading gallery:', error);
      Alert.alert('Error', 'No se pudieron cargar las fotos de la galería.');
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      setSelectedUris([]);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      const granted = await requestPermission();
      if (cancelled) return;

      if (!granted) {
        Alert.alert('Permiso requerido', permissionMessage);
        setIsLoading(false);
        onClose();
        return;
      }

      await fetchPhotos();
      if (!cancelled) setIsLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [visible, fetchPhotos, onClose, permissionMessage]);

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
              if (hasMore && endCursor) fetchPhotos(endCursor);
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
    paddingBottom: spacing.lg,
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
