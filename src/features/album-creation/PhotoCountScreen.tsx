import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@core/theme';
import { Button, GradientBackground } from '@shared/components';

interface PhotoCountScreenProps {
  onSelect: (count: number) => void;
}

const OPTIONS = [
  { count: 40, label: '40 fotos', description: 'Recuerdos esenciales' },
  { count: 80, label: '80 fotos', description: 'Una historia completa' },
  { count: 120, label: '120 fotos', description: 'Sin dejar nada afuera' },
];

export function PhotoCountScreen({ onSelect }: PhotoCountScreenProps) {
  const [selected, setSelected] = useState<number>(80);

  return (
    <GradientBackground variant="warm">
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>
            ¿Cuántos{'\n'}momentos quieres{'\n'}incluir?
          </Text>
          <Text style={styles.subtitle}>
            Elige el tamaño que mejor cuente tu historia.
          </Text>

          <View style={styles.optionsContainer}>
            {OPTIONS.map(option => (
              <TouchableOpacity
                key={option.count}
                style={[
                  styles.option,
                  selected === option.count && styles.optionSelected,
                ]}
                onPress={() => setSelected(option.count)}
                activeOpacity={0.7}>
                <View style={styles.optionTextContainer}>
                  <Text
                    style={[
                      styles.optionLabel,
                      selected === option.count && styles.optionLabelSelected,
                    ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    selected === option.count && styles.radioSelected,
                  ]}>
                  {selected === option.count && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={`Continuar con ${selected} fotos`}
            onPress={() => onSelect(selected)}
            icon="chevron-right"
          />
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing['3xl'],
    paddingTop: spacing['6xl'],
    paddingBottom: spacing['3xl'],
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes['4xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    lineHeight: typography.sizes['4xl'] * typography.lineHeights.tight,
    marginBottom: spacing.lg,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    marginBottom: spacing['3xl'],
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
  },
  optionsContainer: {
    gap: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.text.primary,
    backgroundColor: colors.surface,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  optionLabelSelected: {
    fontWeight: typography.weights.bold,
  },
  optionDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: colors.text.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.text.primary,
  },
  buttonContainer: {
    paddingTop: spacing.xl,
  },
});
