import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '@core/theme';
import { FilterType } from '../types';
import { FilterSelector } from './FilterSelector';
import { FilteredImage } from './FilteredImage';

interface FilterPickerModalProps {
  visible: boolean;
  photoUri: string;
  currentFilter: FilterType;
  onSelectFilter: (filter: FilterType) => void;
  onClose: () => void;
}

export function FilterPickerModal({
  visible,
  photoUri,
  currentFilter,
  onSelectFilter,
  onClose,
}: FilterPickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Aplicar filtro</Text>

          <View style={styles.previewWrap}>
            <FilteredImage
              uri={photoUri}
              filter={currentFilter}
              style={styles.preview}
              resizeMode="cover"
            />
          </View>

          <FilterSelector
            photoUri={photoUri}
            currentFilter={currentFilter}
            onSelectFilter={onSelectFilter}
          />

          <TouchableOpacity style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneText}>Listo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    paddingBottom: spacing['3xl'],
    paddingTop: spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  previewWrap: {
    alignSelf: 'center',
    width: 160,
    height: 160,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceSecondary,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  bwOverlay: {
    backgroundColor: 'rgba(128, 128, 128, 0.45)',
  },
  doneButton: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    height: 52,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.text.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneText: {
    color: colors.text.inverse,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
