import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '@core/theme';
import { FilterType, FILTERS } from '../types';
import { FilteredImage } from './FilteredImage';

interface FilterSelectorProps {
  photoUri: string;
  currentFilter: FilterType;
  onSelectFilter: (filter: FilterType) => void;
}

export function FilterSelector({
  photoUri,
  currentFilter,
  onSelectFilter,
}: FilterSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Filtros</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {FILTERS.map(filter => (
          <TouchableOpacity
            key={filter.type}
            style={[
              styles.filterOption,
              currentFilter === filter.type && styles.filterOptionActive,
            ]}
            onPress={() => onSelectFilter(filter.type)}
            accessibilityLabel={`Filtro ${filter.label}`}
            accessibilityRole="button"
            accessibilityState={{ selected: currentFilter === filter.type }}>
            <View style={[
              styles.filterPreview,
              currentFilter === filter.type && styles.filterPreviewActive,
            ]}>
              <FilteredImage
                uri={photoUri}
                filter={filter.type}
                style={styles.filterImage}
                resizeMode="cover"
              />
            </View>
            <Text
              style={[
                styles.filterLabel,
                currentFilter === filter.type && styles.filterLabelActive,
              ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  filterOption: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  filterOptionActive: {
    transform: [{ scale: 1.05 }],
  },
  filterPreview: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterPreviewActive: {
    borderColor: colors.text.primary,
  },
  filterImage: {
    width: '100%',
    height: '100%',
  },
  filterOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  bwFilter: {
    backgroundColor: 'rgba(128, 128, 128, 0.5)',
  },
  filterLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  filterLabelActive: {
    color: colors.text.primary,
    fontWeight: typography.weights.bold,
  },
});
