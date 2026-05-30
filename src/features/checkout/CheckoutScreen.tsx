import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, typography, spacing, borderRadius } from '@core/theme';
import { Button } from '@shared/components';

interface CheckoutScreenProps {
  albumTitle: string;
  albumDate: string;
  price: number;
  pageCount: number;
  photoCount: number;
  onBack: () => void;
  onConfirm: () => void;
}

type ShippingOption = 'estandar' | 'express';

export function CheckoutScreen({
  albumTitle,
  albumDate,
  price,
  pageCount,
  photoCount,
  onBack,
  onConfirm,
}: CheckoutScreenProps) {
  const [shipping, setShipping] = useState<ShippingOption>('estandar');

  const shippingCost = shipping === 'express' ? 50 : 0;
  const total = price + shippingCost;

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Resumen de{'\n'}compra</Text>

      {/* Album card */}
      <View style={styles.albumCard}>
        <View style={styles.albumThumb} />
        <View style={styles.albumInfo}>
          <Text style={styles.albumTitle}>{albumTitle}</Text>
          <Text style={styles.albumDate}>llega el {albumDate}</Text>
        </View>
        <Text style={styles.albumPrice}>${price}</Text>
      </View>

      {/* Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Páginas</Text>
          <Text style={styles.detailValue}>{pageCount}</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Fotos</Text>
          <Text style={styles.detailValue}>{photoCount}</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Envío</Text>
          <TouchableOpacity style={styles.shippingSelector}>
            <Text style={styles.shippingText}>
              {shipping === 'estandar' ? 'Estándar' : 'Express'}
            </Text>
            <Icon name="chevron-down" size={14} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom CTA */}
      <View style={styles.bottomContainer}>
        <Button
          title={`Volver a pedir · $${total}`}
          onPress={onConfirm}
          icon="shopping-bag"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing['3xl'],
    paddingTop: spacing['3xl'],
  },
  backButton: {
    marginBottom: spacing.xl,
  },
  backText: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  title: {
    fontSize: typography.sizes['4xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    lineHeight: typography.sizes['4xl'] * typography.lineHeights.tight,
    marginBottom: spacing['3xl'],
  },
  albumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent.blue,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing['2xl'],
  },
  albumThumb: {
    width: 44,
    height: 56,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.blue.light,
    marginRight: spacing.md,
  },
  albumInfo: {
    flex: 1,
  },
  albumTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  albumDate: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  albumPrice: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  detailsContainer: {
    gap: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  detailValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  shippingSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  shippingText: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: spacing['3xl'],
    left: spacing['3xl'],
    right: spacing['3xl'],
  },
});
