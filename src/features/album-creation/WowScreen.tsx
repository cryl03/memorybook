import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, typography, spacing, borderRadius } from '@core/theme';
import { Button } from '@shared/components';

interface WowScreenProps {
  albumTitle: string;
  photoCount: number;
  pageCount: number;
  onEdit: () => void;
  onBuy: () => void;
}

export function WowScreen({
  albumTitle,
  photoCount,
  pageCount,
  onEdit,
  onBuy,
}: WowScreenProps) {
  return (
    <View style={styles.container}>
      {/* Album preview mockup */}
      <View style={styles.albumPreview}>
        <View style={styles.albumCover}>
          {/* Placeholder for album cover image */}
          <View style={styles.coverPlaceholder}>
            <View style={styles.coverPhoto} />
            <Text style={styles.coverText}>
              "lo que no se{'\n'}guarda, se olvida..."
            </Text>
          </View>
        </View>
      </View>

      {/* Album info */}
      <Text style={styles.albumTitle}>{albumTitle}</Text>
      <Text style={styles.albumMeta}>
        {photoCount} fotos · {pageCount} páginas
      </Text>

      {/* Page navigation */}
      <View style={styles.pageNav}>
        <TouchableOpacity style={styles.navArrow}>
          <Icon name="chevron-left" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.pageIndicator}>1 de {pageCount}</Text>
        <TouchableOpacity style={styles.navArrow}>
          <Icon name="chevron-right" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Action buttons */}
      <View style={styles.actionsContainer}>
        <View style={styles.actionsRow}>
          <Button
            title="Llévalo contigo · $300"
            onPress={onBuy}
            icon="shopping-bag"
            style={styles.buyButton}
          />
          <TouchableOpacity style={styles.saveButton} onPress={() => {}}>
            <Text style={styles.saveButtonText}>Guardar</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onEdit} style={styles.editLink}>
          <Text style={styles.editLinkText}>Editar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    paddingTop: spacing['4xl'],
  },
  albumPreview: {
    width: 220,
    height: 300,
    marginBottom: spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumCover: {
    width: 200,
    height: 280,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.blue.light,
    overflow: 'hidden',
    // Shadow for book effect
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  coverPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  coverPhoto: {
    width: 120,
    height: 80,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.lg,
    opacity: 0.8,
  },
  coverText: {
    fontSize: typography.sizes.sm,
    fontStyle: 'italic',
    color: colors.text.primary,
    textAlign: 'center',
    opacity: 0.7,
  },
  albumTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  albumMeta: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  pageNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    marginBottom: spacing['3xl'],
  },
  navArrow: {
    padding: spacing.sm,
  },
  pageIndicator: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  actionsContainer: {
    width: '100%',
    paddingHorizontal: spacing['3xl'],
    position: 'absolute',
    bottom: spacing['3xl'],
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  buyButton: {
    flex: 2,
  },
  saveButton: {
    flex: 1,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surfaceSecondary,
  },
  saveButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  editLink: {
    alignItems: 'center',
  },
  editLinkText: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    textDecorationLine: 'underline',
  },
});
