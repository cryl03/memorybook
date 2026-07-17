import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '@core/theme';

interface AlbumSyncOverlayProps {
  visible: boolean;
  step: string;
  progress: number;
}

export function AlbumSyncOverlay({ visible, step, progress }: AlbumSyncOverlayProps) {
  const clampedProgress = Math.max(0, Math.min(progress, 1));

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={colors.text.primary} />
          <Text style={styles.title}>Sincronizando tu álbum</Text>
          <Text style={styles.step}>{step || 'Preparando...'}</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${clampedProgress * 100}%` }]} />
          </View>
          <Text style={styles.percent}>{Math.round(clampedProgress * 100)}%</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  step: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    minHeight: typography.sizes.sm * 1.4,
  },
  track: {
    width: '100%',
    height: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSecondary,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: borderRadius.full,
    backgroundColor: colors.text.primary,
  },
  percent: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    fontWeight: typography.weights.medium,
  },
});
