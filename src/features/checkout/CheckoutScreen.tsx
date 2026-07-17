import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { icons } from '@core/assets/icons';
import { colors, typography, spacing, borderRadius } from '@core/theme';
import { Button } from '@shared/components';
import { albumService } from '@core/api';
import { getErrorMessage } from '@core/api/errors';

interface CheckoutScreenProps {
  albumTitle: string;
  albumDate: string;
  price: number;
  pageCount: number;
  photoCount: number;
  remoteAlbumId?: string;
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
  remoteAlbumId,
  onBack,
  onConfirm,
}: CheckoutScreenProps) {
  const [shipping, setShipping] = useState<ShippingOption>('estandar');
  const [isProcessing, setIsProcessing] = useState(false);

  const shippingCost = shipping === 'express' ? 50 : 0;
  const total = price + shippingCost;

  const handleConfirm = async () => {
    if (!remoteAlbumId) {
      Alert.alert(
        'Álbum en el dispositivo',
        'Inicia sesión para sincronizar tu álbum y completar la compra.',
      );
      return;
    }

    setIsProcessing(true);

    try {
      await albumService.patchAlbum(remoteAlbumId, { nombre: albumTitle });
      await albumService.generateAlbumPdf(remoteAlbumId);

      Alert.alert(
        'Pedido confirmado',
        'Tu álbum fue enviado a producción.',
        [{ text: 'OK', onPress: onConfirm }],
      );
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'No se pudo completar el pedido'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Resumen de{'\n'}compra</Text>

      <View style={styles.albumCard}>
        <View style={styles.albumThumb} />
        <View style={styles.albumInfo}>
          <Text style={styles.albumTitle}>{albumTitle}</Text>
          <Text style={styles.albumDate}>llega el {albumDate}</Text>
        </View>
        <Text style={styles.albumPrice}>${price}</Text>
      </View>

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
          <TouchableOpacity
            style={styles.shippingSelector}
            onPress={() =>
              setShipping(current => (current === 'estandar' ? 'express' : 'estandar'))
            }>
            <Text style={styles.shippingText}>
              {shipping === 'estandar' ? 'Estándar' : 'Express'}
            </Text>
            <Image
              source={icons['arrow-down']}
              style={{ width: 14, height: 14, tintColor: colors.text.secondary }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      {!remoteAlbumId ? (
        <Text style={styles.syncWarning}>
          Tu álbum está guardado en este dispositivo. Inicia sesión para sincronizarlo y completar la compra.
        </Text>
      ) : null}

      <View style={styles.bottomContainer}>
        <Button
          title={`Confirmar pedido · $${total}`}
          onPress={handleConfirm}
          icon="badge"
          loading={isProcessing}
          disabled={isProcessing}
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
  syncWarning: {
    marginTop: spacing.xl,
    fontSize: typography.sizes.sm,
    color: colors.warning,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: spacing['3xl'],
    left: spacing['3xl'],
    right: spacing['3xl'],
  },
});
