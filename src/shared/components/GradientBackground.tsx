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
    warm: ['#FFFFFF', '#F0F4F8', '#EDE8E3', '#F2DFD0'] as const,
    cool: ['#FFFFFF', '#F0F4F8', '#E8EEF4', '#FAFCFE'] as const,
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
