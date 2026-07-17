import React, { useEffect } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  Easing,
  SharedValue,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FOLD_THRESHOLD = 55; // grados
const VELOCITY_THRESHOLD = 750;

interface PageTurnGestureProps {
  children: React.ReactNode;
  currentPage: number;
  pageCount: number;
  onPrev: () => void;
  onNext: () => void;
}

function FoldShading({
  rotateY,
}: {
  rotateY: SharedValue<number>;
}) {
  const leftShade = useAnimatedStyle(() => {
    const angle = Math.abs(Math.min(rotateY.value, 0));
    return {
      opacity: interpolate(angle, [0, 40, 90], [0, 0.18, 0.45], Extrapolation.CLAMP),
    };
  });

  const rightShade = useAnimatedStyle(() => {
    const angle = Math.max(rotateY.value, 0);
    return {
      opacity: interpolate(angle, [0, 40, 90], [0, 0.18, 0.45], Extrapolation.CLAMP),
    };
  });

  const crease = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(rotateY.value), [0, 20, 70], [0.08, 0.28, 0.55], Extrapolation.CLAMP),
  }));

  return (
    <>
      <Animated.View pointerEvents="none" style={[styles.shadeLeft, leftShade]}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.35)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.shadeRight, rightShade]}>
        <LinearGradient
          colors={['rgba(0,0,0,0.35)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.crease, crease]} />
    </>
  );
}

export function PageTurnGesture({
  children,
  currentPage,
  pageCount,
  onPrev,
  onNext,
}: PageTurnGestureProps) {
  const rotateY = useSharedValue(0);
  const pageIndex = useSharedValue(currentPage);
  const lastPageIndex = useSharedValue(Math.max(pageCount - 1, 0));
  const isAnimating = useSharedValue(false);
  const pendingDirection = useSharedValue<0 | 1 | -1>(0); // -1 next, 1 prev

  useEffect(() => {
    pageIndex.value = currentPage;
    lastPageIndex.value = Math.max(pageCount - 1, 0);

    // Entrada: la hoja nueva termina de abrirse desde el lado contrario
    if (pendingDirection.value === -1) {
      rotateY.value = 95;
      rotateY.value = withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) });
    } else if (pendingDirection.value === 1) {
      rotateY.value = -95;
      rotateY.value = withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) });
    } else {
      rotateY.value = 0;
    }

    pendingDirection.value = 0;
    isAnimating.value = false;
  }, [currentPage, isAnimating, lastPageIndex, pageCount, pageIndex, pendingDirection, rotateY]);

  const completeNext = () => {
    onNext();
  };

  const completePrev = () => {
    onPrev();
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-16, 16])
    .failOffsetY([-14, 14])
    .onUpdate(event => {
      if (isAnimating.value) return;

      const canGoPrev = pageIndex.value > 0;
      const canGoNext = pageIndex.value < lastPageIndex.value;
      const x = event.translationX;

      // Izquierda = siguiente (dobla hacia la izquierda, ángulo negativo)
      // Derecha = anterior (dobla hacia la derecha, ángulo positivo)
      let angle = interpolate(
        x,
        [-SCREEN_WIDTH * 0.55, 0, SCREEN_WIDTH * 0.55],
        [-115, 0, 115],
        Extrapolation.CLAMP,
      );

      if ((angle < 0 && !canGoNext) || (angle > 0 && !canGoPrev)) {
        angle *= 0.18;
      }

      rotateY.value = angle;
    })
    .onEnd(event => {
      if (isAnimating.value) return;

      const canGoPrev = pageIndex.value > 0;
      const canGoNext = pageIndex.value < lastPageIndex.value;
      const angle = rotateY.value;
      const velocityBoost =
        event.velocityX < -VELOCITY_THRESHOLD
          ? -1
          : event.velocityX > VELOCITY_THRESHOLD
            ? 1
            : 0;

      const goNext = canGoNext && (angle < -FOLD_THRESHOLD || velocityBoost === -1);
      const goPrev = canGoPrev && (angle > FOLD_THRESHOLD || velocityBoost === 1);

      if (goNext) {
        isAnimating.value = true;
        pendingDirection.value = -1;
        rotateY.value = withTiming(
          -95,
          { duration: 260, easing: Easing.in(Easing.cubic) },
          finished => {
            if (finished) {
              runOnJS(completeNext)();
            }
          },
        );
        return;
      }

      if (goPrev) {
        isAnimating.value = true;
        pendingDirection.value = 1;
        rotateY.value = withTiming(
          95,
          { duration: 260, easing: Easing.in(Easing.cubic) },
          finished => {
            if (finished) {
              runOnJS(completePrev)();
            }
          },
        );
        return;
      }

      rotateY.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });
    });

  const bookStyle = useAnimatedStyle(() => {
    const abs = Math.abs(rotateY.value);
    const scale = interpolate(abs, [0, 90], [1, 0.94], Extrapolation.CLAMP);

    return {
      transform: [
        { perspective: 1600 },
        { scale },
        { rotateY: `${rotateY.value}deg` },
      ],
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.stage, bookStyle]}>
        <View style={styles.bookFace}>{children}</View>
        <FoldShading rotateY={rotateY} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  stage: {
    width: '100%',
    backfaceVisibility: 'hidden',
  },
  bookFace: {
    width: '100%',
  },
  shadeLeft: {
    ...StyleSheet.absoluteFillObject,
    right: '50%',
  },
  shadeRight: {
    ...StyleSheet.absoluteFillObject,
    left: '50%',
  },
  crease: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 2,
    marginLeft: -1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
});
