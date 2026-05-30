import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '@core/theme';

interface GradientBackgroundProps {
  children: React.ReactNode;
  variant?: 'warm' | 'cool' | 'neutral';
  style?: ViewStyle;
}

/**
 * Gradient background using react-native-linear-gradient.
 */
export function GradientBackground({
  children,
  variant = 'warm',
  style,
}: GradientBackgroundProps) {
  const gradientColors = {
    warm: ['#FFFFFF', '#F5EDE6', '#E8D5C4'] as const,
    cool: ['#E8F0F8', '#F0F6FB', '#FAFCFE', '#FFFFFF'] as const,
    neutral: ['#FFFFFF', '#F5F5F5', '#EEEEEE'] as const,
  };

  return (
    <LinearGradient
      colors={[...gradientColors[variant]]}
      style={[styles.container, style]}>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
