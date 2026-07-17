import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Image,
  Pressable,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { splashFigma } from '@core/assets/images';
import { spacing } from '@core/theme';

const { height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

/**
 * Splash matches Figma pixel-for-pixel via the export image.
 * Transparent hit targets sit over the two CTAs.
 */
export function SplashScreen({ onFinish }: SplashScreenProps) {
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });

    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 350 });
      setTimeout(onFinish, 350);
    }, 3200);

    return () => clearTimeout(timer);
  }, []);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Buttons occupy ~bottom 8–14% in the Figma frame
  const hitBottom = Math.max(insets.bottom, spacing.sm) + height * 0.035;
  const hitHeight = Math.max(52, height * 0.055);

  return (
    <Animated.View style={[styles.container, fadeStyle]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <Image
        source={splashFigma}
        style={styles.art}
        resizeMode="stretch"
        accessibilityLabel="Memora book"
      />

      <View style={[styles.hitRow, { bottom: hitBottom, height: hitHeight }]}>
        <Pressable
          style={styles.hitCrear}
          onPress={onFinish}
          accessibilityRole="button"
          accessibilityLabel="Crear mi álbum"
        />
        <Pressable
          style={styles.hitIntro}
          onPress={onFinish}
          accessibilityRole="button"
          accessibilityLabel="Intro"
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  art: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  hitRow: {
    position: 'absolute',
    left: '4%',
    right: '4%',
    flexDirection: 'row',
    gap: 8,
  },
  hitCrear: {
    flex: 1.45,
  },
  hitIntro: {
    flex: 0.75,
  },
});
