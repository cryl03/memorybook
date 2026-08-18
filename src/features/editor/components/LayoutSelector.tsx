import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@core/theme';
import { DISENOS, DisenoPagina, LayoutType } from '../types';

interface LayoutSelectorProps {
  currentDesign: DisenoPagina;
  onSelectDesign: (design: DisenoPagina) => void;
}

/**
 * Simple icon representations for each diseño (API FotosPorPagina 1–4).
 */
function LayoutIcon({ type, active }: { type: LayoutType; active: boolean }) {
  const color = active ? colors.text.inverse : colors.text.secondary;

  switch (type) {
    case 'single':
    case 'full-bleed':
      return (
        <View style={[iconStyles.box, { borderColor: color }]}>
          <View style={[iconStyles.innerFull, { backgroundColor: color }]} />
        </View>
      );
    case 'grid-2':
      return (
        <View style={[iconStyles.box, { borderColor: color, flexDirection: 'row', gap: 2 }]}>
          <View style={[iconStyles.innerHalf, { backgroundColor: color }]} />
          <View style={[iconStyles.innerHalf, { backgroundColor: color }]} />
        </View>
      );
    case 'collage':
      return (
        <View style={[iconStyles.box, { borderColor: color, flexDirection: 'row', gap: 1 }]}>
          <View style={[iconStyles.innerCollageLeft, { backgroundColor: color }]} />
          <View style={{ flex: 1, gap: 1 }}>
            <View style={[iconStyles.innerCollageRight, { backgroundColor: color }]} />
            <View style={[iconStyles.innerCollageRight, { backgroundColor: color }]} />
          </View>
        </View>
      );
    case 'grid-4':
      return (
        <View style={[iconStyles.box, { borderColor: color, flexDirection: 'row', flexWrap: 'wrap', gap: 1 }]}>
          <View style={[iconStyles.innerQuarter, { backgroundColor: color }]} />
          <View style={[iconStyles.innerQuarter, { backgroundColor: color }]} />
          <View style={[iconStyles.innerQuarter, { backgroundColor: color }]} />
          <View style={[iconStyles.innerQuarter, { backgroundColor: color }]} />
        </View>
      );
    default:
      return null;
  }
}

export function LayoutSelector({ currentDesign, onSelectDesign }: LayoutSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Diseño de página</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {DISENOS.map(diseno => (
          <TouchableOpacity
            key={diseno.design}
            style={[
              styles.layoutOption,
              currentDesign === diseno.design && styles.layoutOptionActive,
            ]}
            onPress={() => onSelectDesign(diseno.design)}
            accessibilityLabel={diseno.label}
            accessibilityRole="button"
            accessibilityState={{ selected: currentDesign === diseno.design }}>
            <LayoutIcon
              type={diseno.type}
              active={currentDesign === diseno.design}
            />
            <Text
              style={[
                styles.layoutLabel,
                currentDesign === diseno.design && styles.layoutLabelActive,
              ]}>
              {diseno.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const iconStyles = StyleSheet.create({
  box: {
    width: 28,
    height: 28,
    borderWidth: 1.5,
    borderRadius: 4,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxFull: {
    width: 28,
    height: 28,
    borderRadius: 4,
  },
  innerFull: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  innerHalf: {
    flex: 1,
    height: '100%',
    borderRadius: 1,
  },
  innerQuarter: {
    width: '47%',
    height: '47%',
    borderRadius: 1,
  },
  innerCollageLeft: {
    flex: 2,
    height: '100%',
    borderRadius: 1,
  },
  innerCollageRight: {
    flex: 1,
    width: '100%',
    borderRadius: 1,
  },
});

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
    gap: spacing.sm,
  },
  layoutOption: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    minWidth: 70,
    gap: spacing.xs,
  },
  layoutOptionActive: {
    backgroundColor: colors.text.primary,
  },
  layoutLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  layoutLabelActive: {
    color: colors.text.inverse,
  },
});
