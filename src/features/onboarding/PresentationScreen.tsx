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
      { text: 'historia\ncuidadosamente\ndiseñada para ti', highlight: true },
    ],
  },
  {
    id: '3',
    image: slideImages.slide3,
    textParts: [
      { text: 'Un ' },
      { text: 'libro', highlight: true },
      { text: ' que puedes\ntocar, guardar y ' },
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
      {/* Image — top portion with rounded bottom corners */}
      <View style={styles.imageContainer}>
        <Image source={item.image} style={styles.image} resizeMode="cover" />
        {/* Subtle overlay gradient at bottom of image */}
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.3)']}
          style={styles.imageOverlay}
        />
      </View>

      {/* Text content — below image */}
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
      {/* Background gradient — light blue to white */}
      <LinearGradient
        colors={['#E8F0F8', '#F0F6FB', '#FAFCFE', '#FFFFFF']}
        locations={[0, 0.3, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

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
            <Text style={styles.createButtonIcon}> ✏️</Text>
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
    height: height * 0.45,
    width: width - spacing['3xl'] * 2,
    marginHorizontal: spacing['3xl'],
    marginTop: spacing['5xl'],
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
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
    height: 60,
  },
  textContainer: {
    flex: 1,
    paddingHorizontal: spacing['3xl'],
    paddingTop: spacing['2xl'],
    justifyContent: 'flex-start',
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
