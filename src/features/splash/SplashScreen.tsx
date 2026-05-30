import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { colors, typography, spacing } from '@core/theme';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const taglineOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(20);
  const buttonsOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(30);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    // Logo fade in + scale
    logoOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    logoScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });

    // Tagline fade in
    taglineOpacity.value = withDelay(
      600,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
    taglineTranslateY.value = withDelay(
      600,
      withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );

    // Buttons fade in
    buttonsOpacity.value = withDelay(
      1000,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
    buttonsTranslateY.value = withDelay(
      1000,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );

    // Auto-advance after 3 seconds
    const timer = setTimeout(() => {
      containerOpacity.value = withTiming(0, { duration: 400 });
      setTimeout(onFinish, 400);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const taglineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  const buttonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslateY.value }],
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#FFFFFF', '#F5EDE6', '#E8D5C4']}
        locations={[0, 0.5, 1]}
        style={styles.gradient}>
        {/* Top labels */}
        <Animated.View style={[styles.topLabels, taglineAnimatedStyle]}>
          <Text style={styles.topLabel}>Cuentas</Text>
          <Text style={styles.topLabelLight}>Viajes</Text>
        </Animated.View>

        {/* Logo */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <Text style={styles.logoMain}>MEMORA</Text>
          <Text style={styles.logoSub}>book</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={[styles.taglineContainer, taglineAnimatedStyle]}>
          <Text style={styles.tagline}>
            Un espacio donde tu vida toma{'\n'}forma de libro
          </Text>
        </Animated.View>

        {/* Bottom section with category pills and buttons */}
        <Animated.View style={[styles.bottomSection, buttonsAnimatedStyle]}>
          {/* Category pills */}
          <View style={styles.pillsContainer}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Cuentos</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Recuerdos</Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.buttonsRow}>
            <View style={styles.outlineButton}>
              <Text style={styles.outlineButtonText}>Crear mi álbum</Text>
              <Text style={styles.outlineButtonIcon}> 📖</Text>
            </View>
            <View style={styles.darkButton}>
              <Text style={styles.darkButtonText}>Inicio</Text>
              <Text style={styles.darkButtonIcon}> 🔍</Text>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: height * 0.1,
    paddingBottom: spacing['3xl'],
    paddingHorizontal: spacing['3xl'],
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topLabels: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  topLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: typography.weights.regular,
  },
  topLabelLight: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    fontWeight: typography.weights.light,
    fontStyle: 'italic',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: -spacing['2xl'],
  },
  logoMain: {
    fontSize: typography.sizes['5xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: 6,
    fontFamily: 'serif',
  },
  logoSub: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.light,
    color: colors.text.primary,
    letterSpacing: 4,
    marginTop: -spacing.sm,
    fontFamily: 'serif',
    fontStyle: 'italic',
  },
  taglineContainer: {
    alignItems: 'center',
  },
  tagline: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.lg,
  },
  pillsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  pillText: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
  },
  buttonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.md,
  },
  outlineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.text.primary,
  },
  outlineButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
  },
  outlineButtonIcon: {
    fontSize: 14,
  },
  darkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 24,
    backgroundColor: colors.text.primary,
  },
  darkButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.text.inverse,
    fontWeight: typography.weights.medium,
  },
  darkButtonIcon: {
    fontSize: 14,
  },
});
