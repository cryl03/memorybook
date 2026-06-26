import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '@core/theme';

const DECORATION_OPTIONS = [
  { id: 'star', label: 'Estrella' },
  { id: 'heart', label: 'Corazón' },
  { id: 'circle', label: 'Círculo' },
  { id: 'diamond', label: 'Diamante' },
  { id: 'dot-lg', label: 'Punto grande' },
  { id: 'dot-sm', label: 'Punto' },
  { id: 'line-h', label: 'Línea' },
  { id: 'line-v', label: 'Línea vertical' },
  { id: 'square', label: 'Cuadrado' },
  { id: 'triangle', label: 'Triángulo' },
  { id: 'frame', label: 'Marco' },
  { id: 'wave', label: 'Onda' },
];

interface StickerPickerProps {
  visible: boolean;
  onSelect: (label: string) => void;
  onClose: () => void;
}

export function StickerPicker({ visible, onSelect, onClose }: StickerPickerProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
        accessibilityLabel="Cerrar decoraciones"
        accessibilityRole="button">
        <View style={styles.container}>
          <View style={styles.handle} />
          <Text style={styles.title}>Decoraciones</Text>
          <Text style={styles.subtitle}>
            Toca un elemento para agregarlo a la página
          </Text>
          <View style={styles.grid}>
            {DECORATION_OPTIONS.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.decorItem}
                onPress={() => {
                  onSelect(item.label);
                  onClose();
                }}
                accessibilityLabel={`Decoración ${item.label}`}
                accessibilityRole="button">
                <DecorationShape id={item.id} />
                <Text style={styles.decorLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function DecorationShape({ id }: { id: string }) {
  const base = { backgroundColor: colors.text.primary };

  switch (id) {
    case 'star':
      return <View style={[shapeStyles.star, base]} />;
    case 'heart':
      return <View style={[shapeStyles.circle, { backgroundColor: colors.warm.medium }]} />;
    case 'circle':
      return <View style={[shapeStyles.circle, base]} />;
    case 'diamond':
      return <View style={[shapeStyles.diamond, base]} />;
    case 'dot-lg':
      return <View style={[shapeStyles.dotLg, base]} />;
    case 'dot-sm':
      return <View style={[shapeStyles.dotSm, base]} />;
    case 'line-h':
      return <View style={[shapeStyles.lineH, base]} />;
    case 'line-v':
      return <View style={[shapeStyles.lineV, base]} />;
    case 'square':
      return <View style={[shapeStyles.square, base]} />;
    case 'triangle':
      return <View style={[shapeStyles.triangle, { borderBottomColor: colors.text.primary }]} />;
    case 'frame':
      return <View style={[shapeStyles.frame, { borderColor: colors.text.primary }]} />;
    case 'wave':
      return <View style={[shapeStyles.wave, base]} />;
    default:
      return <View style={[shapeStyles.dotSm, base]} />;
  }
}

const shapeStyles = StyleSheet.create({
  star: { width: 16, height: 16, borderRadius: 2, transform: [{ rotate: '45deg' }] },
  circle: { width: 16, height: 16, borderRadius: 8 },
  diamond: { width: 12, height: 12, transform: [{ rotate: '45deg' }] },
  dotLg: { width: 12, height: 12, borderRadius: 6 },
  dotSm: { width: 8, height: 8, borderRadius: 4 },
  lineH: { width: 20, height: 3, borderRadius: 1.5 },
  lineV: { width: 3, height: 20, borderRadius: 1.5 },
  square: { width: 14, height: 14, borderRadius: 2 },
  triangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    backgroundColor: 'transparent',
  },
  frame: { width: 16, height: 16, borderWidth: 2, borderRadius: 2, backgroundColor: 'transparent' },
  wave: { width: 20, height: 4, borderRadius: 2 },
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
    paddingTop: spacing.md,
    maxHeight: '55%',
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
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  decorItem: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    gap: spacing.xs,
  },
  decorLabel: {
    fontSize: 9,
    color: colors.text.tertiary,
    fontWeight: typography.weights.medium,
  },
});
