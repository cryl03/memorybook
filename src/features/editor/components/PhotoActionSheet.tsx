import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '@core/theme';

interface PhotoActionSheetProps {
  visible: boolean;
  photoIndex: number;
  onReplace: () => void;
  onDelete: () => void;
  onApplyFilter: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onClose: () => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
}

export function PhotoActionSheet({
  visible,
  photoIndex,
  onReplace,
  onDelete,
  onApplyFilter,
  onMoveLeft,
  onMoveRight,
  onClose,
  canMoveLeft,
  canMoveRight,
}: PhotoActionSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
        accessibilityLabel="Cerrar opciones"
        accessibilityRole="button">
        <View
          style={styles.sheet}
          onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />
          <Text style={styles.title}>Foto {photoIndex + 1}</Text>

          <TouchableOpacity
            style={styles.action}
            onPress={onApplyFilter}
            accessibilityLabel="Aplicar filtro"
            accessibilityRole="button">
            <View style={styles.actionContent}>
              <Text style={styles.actionText}>Aplicar filtro</Text>
              <Text style={styles.actionSubtext}>Cambia el estilo visual</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.action}
            onPress={onReplace}
            accessibilityLabel="Reemplazar foto"
            accessibilityRole="button">
            <View style={styles.actionContent}>
              <Text style={styles.actionText}>Reemplazar</Text>
              <Text style={styles.actionSubtext}>Elige otra foto de tu galería</Text>
            </View>
          </TouchableOpacity>

          {canMoveLeft && (
            <TouchableOpacity
              style={styles.action}
              onPress={onMoveLeft}
              accessibilityLabel="Mover a la izquierda"
              accessibilityRole="button">
              <View style={styles.actionContent}>
                <Text style={styles.actionText}>Mover antes</Text>
                <Text style={styles.actionSubtext}>Cambia el orden</Text>
              </View>
            </TouchableOpacity>
          )}

          {canMoveRight && (
            <TouchableOpacity
              style={styles.action}
              onPress={onMoveRight}
              accessibilityLabel="Mover a la derecha"
              accessibilityRole="button">
              <View style={styles.actionContent}>
                <Text style={styles.actionText}>Mover después</Text>
                <Text style={styles.actionSubtext}>Cambia el orden</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.action, styles.deleteAction]}
            onPress={onDelete}
            accessibilityLabel="Eliminar foto"
            accessibilityRole="button">
            <View style={styles.actionContent}>
              <Text style={[styles.actionText, styles.deleteText]}>Eliminar</Text>
              <Text style={styles.actionSubtext}>Quita la foto de esta página</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            accessibilityLabel="Cancelar"
            accessibilityRole="button">
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
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
    paddingHorizontal: spacing.xl,
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
    marginBottom: spacing.lg,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  actionContent: {
    flex: 1,
  },
  actionText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  actionSubtext: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  deleteAction: {
    borderBottomWidth: 0,
  },
  deleteText: {
    color: colors.error,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceSecondary,
  },
  cancelText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
});
