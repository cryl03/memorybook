import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Image,
  TouchableOpacity,
  ImageSourcePropType,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  interpolate,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';
import { colors, typography, spacing, borderRadius } from '@core/theme';
import { icons } from '@core/assets/icons';
import { slideImages } from '@core/assets/images';

const { width, height } = Dimensions.get('window');

interface PresentationScreenProps {
  onNext: () => void;
  onLogin: () => void;
}

interface Slide {
  id: string;
  image: ImageSourcePropType;
  textParts: Array<{ text: string; highlight?: boolean }>;
}

const slides: Slide[] = [
  {
    id: '1',
    image: slideImages.slide1,
    textParts: [
      { text: 'Algunos momentos\nmerecen ' },
      { text: 'quedarse', highlight: true },
    ],
  },
  {
    id: '2',
    image: slideImages.slide2,
    textParts: [
      { text: 'Tus fotos convertidas\nen una ' },
      { text: 'historia\n', highlight: true },
      { text: 'cuidadosamente\n' },
      { text: 'diseñada para ti', highlight: true },
    ],
  },
  {
    id: '3',
    image: slideImages.slide3,
    textParts: [
      { text: 'Un ' },
      { text: 'libro que puedes', highlight: true },
      { text: ' \ntocar, guardar y ' },
      { text: 'volver\na sentir', highlight: true },
    ],
  },
];

export function PresentationScreen({ onNext, onLogin }: PresentationScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Animations
  const imageScale = useSharedValue(1);
  const textOpacity = useSharedValue(1);
  const textTranslateY = useSharedValue(0);
  const bottomOpacity = useSharedValue(0);

  useEffect(() => {
    // Initial entrance animation for bottom section
    bottomOpacity.value = withDelay(
      300,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
  }, []);

  useEffect(() => {
    // Animate on slide change
    textOpacity.value = 0;
    textTranslateY.value = 20;
    imageScale.value = 1.05;

    textOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );
    textTranslateY.value = withDelay(
      200,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );
    imageScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      onNext();
    }
  };

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const bottomAnimatedStyle = useAnimatedStyle(() => ({
    opacity: bottomOpacity.value,
  }));

  const renderSlide = ({ item, index }: { item: Slide; index: number }) => (
    <View style={styles.slide}>
      {/* Full-bleed image with fade to white */}
      <View style={styles.imageContainer}>
        <Image source={item.image} style={styles.image} resizeMode="cover" />
        {/* Gradient fade from image to white */}
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.85)', '#FFFFFF']}
          locations={[0, 0.3, 0.65, 1]}
          style={styles.imageOverlay}
        />
      </View>

      {/* Text overlapping the fade area */}
      <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
        <Text style={styles.slideTitle}>
          {item.textParts.map((part, idx) =>
            part.highlight ? (
              <Text key={idx} style={styles.highlight}>
                {part.text}
              </Text>
            ) : (
              <Text key={idx}>{part.text}</Text>
            ),
          )}
        </Text>
      </Animated.View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        bounces={false}
      />

      {/* Bottom section with dots + buttons */}
      <Animated.View style={[styles.bottomContainer, bottomAnimatedStyle]}>
        {/* Pagination dots */}
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* Action buttons */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleNext}
            activeOpacity={0.7}>
            <Text style={styles.secondaryButtonText}>Siguiente</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createButton}
            onPress={onNext}
            activeOpacity={0.8}>
            <Text style={styles.createButtonText}>Crear</Text>
            <Image
              source={icons.new}
              style={{ width: 14, height: 14, marginLeft: 4, tintColor: colors.text.inverse }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Login link */}
        <TouchableOpacity onPress={onLogin} style={styles.loginLink}>
          <Text style={styles.loginText}>
            ¿Ya tienes una cuenta?{' '}
            <Text style={styles.loginTextBold}>Inicia sesión aquí</Text>
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  slide: {
    width,
    flex: 1,
  },
  imageContainer: {
    height: height * 0.65,
    width: width,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.35,
  },
  textContainer: {
    position: 'absolute',
    bottom: height * 0.25,
    left: 0,
    right: 0,
    paddingHorizontal: spacing['3xl'],
    paddingBottom: spacing.xl,
  },
  slideTitle: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.regular,
    color: colors.text.primary,
    lineHeight: typography.sizes['3xl'] * typography.lineHeights.tight,
  },
  highlight: {
    color: '#5B8DB8',
    fontStyle: 'italic',
  },
  bottomContainer: {
    paddingHorizontal: spacing['3xl'],
    paddingBottom: spacing['3xl'],
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D0D0D0',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: colors.text.primary,
    width: 22,
    borderRadius: 3,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
  },
  secondaryButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  createButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: colors.text.primary,
  },
  createButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.inverse,
  },
  createButtonIcon: {
    fontSize: 14,
  },
  loginLink: {
    alignItems: 'center',
  },
  loginText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  loginTextBold: {
    fontWeight: typography.weights.semibold,
    textDecorationLine: 'underline',
    color: colors.text.primary,
  },
});
