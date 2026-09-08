import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Image,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Canvas,
  Fill,
  Circle,
  Blur,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { icons } from '@core/assets/icons';
import { colors, spacing, typography } from '@core/theme';

const { width, height } = Dimensions.get('window');

const SERIF = Platform.select({ ios: 'Didot', android: 'serif', default: 'serif' });

export type SplashAction = 'create' | 'intro' | 'auto';

interface SplashScreenProps {
  onFinish: (action: SplashAction) => void;
  autoContinue?: boolean;
}

function GradientWash() {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [t]);

  const c1x = useDerivedValue(() => width * 0.02 + t.value * width * 0.14);
  const c1y = useDerivedValue(() => height * 0.18 + t.value * height * 0.07);
  const c2x = useDerivedValue(() => width * 0.98 - t.value * width * 0.12);
  const c2y = useDerivedValue(() => height * 0.72 - t.value * height * 0.06);
  const c3x = useDerivedValue(() => width * 0.62 + t.value * width * 0.06);
  const c3y = useDerivedValue(() => height * 0.08 + (1 - t.value) * height * 0.05);
  const c4x = useDerivedValue(() => width * 0.2 - t.value * width * 0.05);
  const c4y = useDerivedValue(() => height * 0.86 - t.value * height * 0.04);

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Fill color="#FBF8F4" />
      <Circle cx={c1x} cy={c1y} r={width * 0.62} color="#C3D6DE" opacity={0.7}>
        <Blur blur={90} />
      </Circle>
      <Circle cx={c2x} cy={c2y} r={width * 0.7} color="#EBC4A6" opacity={0.62}>
        <Blur blur={100} />
      </Circle>
      <Circle cx={c3x} cy={c3y} r={width * 0.42} color="#F3E4D4" opacity={0.5}>
        <Blur blur={70} />
      </Circle>
      <Circle cx={c4x} cy={c4y} r={width * 0.4} color="#D7E4EA" opacity={0.45}>
        <Blur blur={80} />
      </Circle>
    </Canvas>
  );
}

function FloatingChip({
  label,
  delay,
  amplitude,
  style,
}: {
  label: string;
  delay: number;
  amplitude: number;
  style: object;
}) {
  const opacity = useSharedValue(0);
  const enterY = useSharedValue(16);
  const floatY = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 650 }));
    enterY.value = withDelay(
      delay,
      withTiming(0, { duration: 650, easing: Easing.out(Easing.cubic) }),
    );
    floatY.value = withDelay(
      delay + 700,
      withRepeat(
        withSequence(
          withTiming(-amplitude, {
            duration: 2400 + delay * 0.4,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(amplitude, {
            duration: 2400 + delay * 0.4,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        true,
      ),
    );
  }, [amplitude, delay, enterY, floatY, opacity]);

  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: enterY.value + floatY.value }],
  }));

  return (
    <Animated.View style={[styles.chip, style, anim]}>
      <Text style={styles.chipText}>{label}</Text>
    </Animated.View>
  );
}

export function SplashScreen({ onFinish, autoContinue = false }: SplashScreenProps) {
  const insets = useSafeAreaInsets();
  const brandOpacity = useSharedValue(0);
  const brandScale = useSharedValue(0.92);
  const bookOpacity = useSharedValue(0);
  const bookY = useSharedValue(10);
  const tagOpacity = useSharedValue(0);
  const tagY = useSharedValue(12);
  const buttonsOpacity = useSharedValue(0);
  const buttonsY = useSharedValue(24);
  const finishedRef = useRef(false);
  const mountedAtRef = useRef(Date.now());

  const finish = (action: SplashAction) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish(action);
  };

  useEffect(() => {
    brandOpacity.value = withDelay(180, withTiming(1, { duration: 700 }));
    brandScale.value = withDelay(
      180,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }),
    );
    bookOpacity.value = withDelay(520, withTiming(1, { duration: 600 }));
    bookY.value = withDelay(
      520,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
    tagOpacity.value = withDelay(780, withTiming(1, { duration: 600 }));
    tagY.value = withDelay(
      780,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
    buttonsOpacity.value = withDelay(980, withTiming(1, { duration: 650 }));
    buttonsY.value = withDelay(
      980,
      withTiming(0, { duration: 650, easing: Easing.out(Easing.cubic) }),
    );
  }, [
    bookOpacity,
    bookY,
    brandOpacity,
    brandScale,
    buttonsOpacity,
    buttonsY,
    tagOpacity,
    tagY,
  ]);

  useEffect(() => {
    if (!autoContinue) return;
    const remaining = Math.max(0, 2800 - (Date.now() - mountedAtRef.current));
    const timer = setTimeout(() => finish('auto'), remaining);
    return () => clearTimeout(timer);
  }, [autoContinue]);

  const brandStyle = useAnimatedStyle(() => ({
    opacity: brandOpacity.value,
    transform: [{ scale: brandScale.value }],
  }));
  const bookStyle = useAnimatedStyle(() => ({
    opacity: bookOpacity.value,
    transform: [{ translateY: bookY.value }],
  }));
  const tagStyle = useAnimatedStyle(() => ({
    opacity: tagOpacity.value,
    transform: [{ translateY: tagY.value }],
  }));
  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsY.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <GradientWash />

      <FloatingChip
        label="Viajes"
        delay={280}
        amplitude={8}
        style={styles.chipViajes}
      />
      <FloatingChip
        label="Familia"
        delay={420}
        amplitude={7}
        style={styles.chipFamilia}
      />
      <FloatingChip
        label="Recuerdos"
        delay={560}
        amplitude={9}
        style={styles.chipRecuerdos}
      />
      <FloatingChip
        label="Eventos"
        delay={640}
        amplitude={6}
        style={styles.chipEventos}
      />

      <View style={styles.center} pointerEvents="none">
        <Animated.Text style={[styles.brand, brandStyle]}>MEMORA</Animated.Text>
        <Animated.Text style={[styles.brandBook, bookStyle]}>book</Animated.Text>
        <Animated.Text style={[styles.tagline, tagStyle]}>
          Un espacio donde tu vida{'\n'}toma forma de libro
        </Animated.Text>
      </View>

      <Animated.View
        style={[
          styles.buttonsRow,
          { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.md },
          buttonsStyle,
        ]}>
        <Pressable
          style={({ pressed }) => [styles.btnCreate, pressed && styles.pressed]}
          onPress={() => finish('create')}
          accessibilityRole="button"
          accessibilityLabel="Crear mi álbum">
          <Text style={styles.btnCreateText}>Crear mi álbum</Text>
          <Image
            source={icons.book}
            style={styles.btnIconDark}
            resizeMode="contain"
          />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.btnIntro, pressed && styles.pressed]}
          onPress={() => finish('intro')}
          accessibilityRole="button"
          accessibilityLabel="Intro">
          <Text style={styles.btnIntroText}>Intro</Text>
          <Image
            source={icons.search}
            style={styles.btnIconLight}
            resizeMode="contain"
          />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF8F4',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: height * 0.06,
  },
  brand: {
    fontFamily: SERIF,
    fontSize: 52,
    lineHeight: 56,
    color: colors.text.primary,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  brandBook: {
    fontFamily: SERIF,
    fontSize: 34,
    lineHeight: 38,
    color: colors.text.primary,
    marginTop: -6,
    textAlign: 'center',
  },
  tagline: {
    marginTop: spacing['2xl'],
    fontSize: typography.sizes.md,
    lineHeight: typography.sizes.md * 1.45,
    color: colors.text.primary,
    textAlign: 'center',
    fontWeight: typography.weights.regular,
  },
  chip: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.72)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: '#8A7A6A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  chipText: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
  },
  chipViajes: {
    top: height * 0.26,
    left: width * 0.07,
  },
  chipFamilia: {
    top: height * 0.3,
    right: width * 0.09,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  chipRecuerdos: {
    top: height * 0.58,
    left: width * 0.06,
  },
  chipEventos: {
    top: height * 0.55,
    right: width * 0.1,
  },
  buttonsRow: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
  },
  btnCreate: {
    flex: 1.45,
    height: 56,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  btnIntro: {
    flex: 0.78,
    height: 56,
    borderRadius: 999,
    backgroundColor: colors.black,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnCreateText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  btnIntroText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.inverse,
  },
  btnIconDark: {
    width: 16,
    height: 16,
    tintColor: colors.text.primary,
  },
  btnIconLight: {
    width: 15,
    height: 15,
    tintColor: colors.text.inverse,
  },
  pressed: {
    opacity: 0.86,
  },
});
