import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '@core/theme';
import type { GalleryAlbumOption } from './photoLibrary';
import { RECENTS_ALBUM_ID } from './photoLibrary';

interface AlbumPickerModalProps {
  visible: boolean;
  albums: GalleryAlbumOption[];
  selectedId: string;
  onSelect: (album: GalleryAlbumOption) => void;
  onClose: () => void;
}

export function AlbumPickerModal({
  visible,
  albums,
  selectedId,
  onSelect,
  onClose,
}: AlbumPickerModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Álbumes</Text>
          <FlatList
            data={albums}
            keyExtractor={item => item.id}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            renderItem={({ item }) => {
              const selected = item.id === selectedId;
              const countLabel =
                item.id === RECENTS_ALBUM_ID
                  ? 'Todas las fotos visibles'
                  : `${item.count} foto${item.count === 1 ? '' : 's'}`;
              return (
                <TouchableOpacity
                  style={[styles.row, selected && styles.rowSelected]}
                  onPress={() => onSelect(item)}
                  activeOpacity={0.7}>
                  <View style={styles.rowText}>
                    <Text style={styles.albumTitle}>{item.title}</Text>
                    <Text style={styles.albumCount}>{countLabel}</Text>
                  </View>
                  {selected ? <Text style={styles.check}>✓</Text> : null}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    maxHeight: '70%',
    paddingTop: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  rowSelected: {
    backgroundColor: colors.surfaceSecondary,
  },
  rowText: {
    flex: 1,
  },
  albumTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  albumCount: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  check: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontWeight: typography.weights.bold,
  },
});
