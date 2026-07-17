import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  LayoutChangeEvent,
  InteractionManager,
} from 'react-native';
import {
  Canvas,
  Fill,
  ImageShader,
  Shader,
  Skia,
  makeImageFromView,
  type SkImage,
} from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { PAGE_CURL_SHADER } from './pageCurlShader';

/** Match editor gradient so curl never flashes Skia’s default black */
const CURL_BG = '#F5F8FA';

interface BookPageCurlProps {
  currentPage: number;
  pageCount: number;
  onPrev: () => void;
  onNext: () => void;
  renderPage: (pageIndex: number) => React.ReactNode;
}

type SnapTarget = 'current' | 'next' | 'prev';

export function BookPageCurl({
  currentPage,
  pageCount,
  onPrev,
  onNext,
  renderPage,
}: BookPageCurlProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [isCurling, setIsCurling] = useState(false);

  const currentRef = useRef<View>(null);
  const nextRef = useRef<View>(null);
  const prevRef = useRef<View>(null);

  const currentImage = useSharedValue<SkImage | null>(null);
  const nextImage = useSharedValue<SkImage | null>(null);
  const prevImage = useSharedValue<SkImage | null>(null);

  const progress = useSharedValue(0);
  const topFlag = useSharedValue(1);
  /** 0 = next (peel leftward), 1 = prev (peel rightward) */
  const mirrorX = useSharedValue(0);
  const animDir = useSharedValue<'next' | 'prev'>('next');
  const dirLocked = useSharedValue(false);
  const pageIndex = useSharedValue(currentPage);
  const lastPageIndex = useSharedValue(Math.max(pageCount - 1, 0));
  const isAnimating = useSharedValue(false);

  const effect = useMemo(() => Skia.RuntimeEffect.Make(PAGE_CURL_SHADER)!, []);

  useEffect(() => {
    pageIndex.value = currentPage;
    lastPageIndex.value = Math.max(pageCount - 1, 0);
  }, [currentPage, lastPageIndex, pageCount, pageIndex]);

  const capture = useCallback(async (target: SnapTarget) => {
    const ref =
      target === 'current' ? currentRef : target === 'next' ? nextRef : prevRef;
    if (!ref.current || size.width <= 0) return null;

    await new Promise<void>(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });

    await new Promise<void>(resolve => {
      InteractionManager.runAfterInteractions(() => resolve());
    });

    try {
      return await makeImageFromView(ref);
    } catch (error) {
      console.warn('Page curl snapshot failed:', error);
      return null;
    }
  }, [size.width]);

  const refreshSnapshots = useCallback(async () => {
    const [cur, nxt, prv] = await Promise.all([
      capture('current'),
      currentPage < pageCount - 1 ? capture('next') : Promise.resolve(null),
      currentPage > 0 ? capture('prev') : Promise.resolve(null),
    ]);

    if (cur) currentImage.value = cur;
    if (nxt) nextImage.value = nxt;
    if (prv) prevImage.value = prv;
  }, [
    capture,
    currentImage,
    currentPage,
    nextImage,
    pageCount,
    prevImage,
  ]);

  useEffect(() => {
    if (size.width <= 0) return;
    const timer = setTimeout(() => {
      void refreshSnapshots();
    }, 80);
    return () => clearTimeout(timer);
  }, [currentPage, refreshSnapshots, size]);

  const finishCurl = useCallback(
    (direction: 'next' | 'prev') => {
      progress.value = 0;
      isAnimating.value = false;
      setIsCurling(false);
      if (direction === 'next') onNext();
      else onPrev();
    },
    [isAnimating, onNext, onPrev, progress],
  );

  const startCurlOverlay = useCallback(() => {
    setIsCurling(true);
  }, []);

  const pan = Gesture.Pan()
    .activeOffsetX([-22, 22])
    .failOffsetY([-16, 16])
    .onBegin(event => {
      topFlag.value = event.y < size.height / 2 ? 0 : 1;
      dirLocked.value = false;
      progress.value = 0;
    })
    .onUpdate(event => {
      if (isAnimating.value) return;

      const canGoPrev = pageIndex.value > 0;
      const canGoNext = pageIndex.value < lastPageIndex.value;
      const x = event.translationX;
      const absX = Math.abs(x);

      if (!dirLocked.value && absX > 10) {
        const wantsNext = x < 0;
        if ((wantsNext && !canGoNext) || (!wantsNext && !canGoPrev)) {
          progress.value = Math.min(absX / size.width, 0.12);
          return;
        }
        animDir.value = wantsNext ? 'next' : 'prev';
        mirrorX.value = wantsNext ? 0 : 1;
        dirLocked.value = true;
        runOnJS(startCurlOverlay)();
      }

      if (!dirLocked.value) return;

      if (animDir.value === 'next') {
        progress.value = Math.min(Math.max(-x, 0) / size.width, 1);
      } else {
        progress.value = Math.min(Math.max(x, 0) / size.width, 1);
      }
    })
    .onEnd(event => {
      if (isAnimating.value) return;

      const canGoPrev = pageIndex.value > 0;
      const canGoNext = pageIndex.value < lastPageIndex.value;
      const shouldCommit =
        progress.value > 0.28 ||
        (animDir.value === 'next' && event.velocityX < -850) ||
        (animDir.value === 'prev' && event.velocityX > 850);

      const goingNext = animDir.value === 'next' && canGoNext;
      const goingPrev = animDir.value === 'prev' && canGoPrev;

      if (dirLocked.value && shouldCommit && (goingNext || goingPrev)) {
        isAnimating.value = true;
        const direction = animDir.value;
        progress.value = withTiming(1, { duration: 420 }, finished => {
          if (finished) {
            dirLocked.value = false;
            runOnJS(finishCurl)(direction);
          }
        });
        return;
      }

      progress.value = withSpring(0, { damping: 18, stiffness: 160 }, finished => {
        if (finished) {
          dirLocked.value = false;
          runOnJS(setIsCurling)(false);
        }
      });
    });

  const uniforms = useDerivedValue(() => ({
    resolution: [Math.max(size.width, 1), Math.max(size.height, 1)],
    progress: progress.value,
    topFlag: topFlag.value,
    mirrorX: mirrorX.value,
  }));

  const fromImage = useDerivedValue(() => currentImage.value);

  const toImage = useDerivedValue(() => {
    if (animDir.value === 'prev') {
      return prevImage.value ?? currentImage.value;
    }
    return nextImage.value ?? currentImage.value;
  });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setSize({ width, height });
    }
  };

  const hasSize = size.width > 0 && size.height > 0;
  const nextPage = Math.min(currentPage + 1, pageCount - 1);
  const prevPage = Math.max(currentPage - 1, 0);

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.container} onLayout={onLayout}>
        {hasSize ? (
          <View style={styles.snapshotLayer} pointerEvents="none">
            <View
              ref={currentRef}
              collapsable={false}
              style={[
                styles.snapshotPage,
                { width: size.width, height: size.height, backgroundColor: CURL_BG },
              ]}>
              {renderPage(currentPage)}
            </View>
            {currentPage < pageCount - 1 ? (
              <View
                ref={nextRef}
                collapsable={false}
                style={[
                  styles.snapshotPage,
                  { width: size.width, height: size.height, backgroundColor: CURL_BG },
                ]}>
                {renderPage(nextPage)}
              </View>
            ) : null}
            {currentPage > 0 ? (
              <View
                ref={prevRef}
                collapsable={false}
                style={[
                  styles.snapshotPage,
                  { width: size.width, height: size.height, backgroundColor: CURL_BG },
                ]}>
                {renderPage(prevPage)}
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={[styles.liveLayer, isCurling && styles.hidden]} pointerEvents="box-none">
          {renderPage(currentPage)}
        </View>

        {hasSize && isCurling ? (
          <Animated.View
            style={[
              styles.canvasWrap,
              { width: size.width, height: size.height, backgroundColor: CURL_BG },
            ]}>
            <Canvas style={{ width: size.width, height: size.height }}>
              <Fill color={CURL_BG} />
              <Fill>
                <Shader source={effect} uniforms={uniforms}>
                  <ImageShader
                    image={fromImage}
                    fit="cover"
                    width={size.width}
                    height={size.height}
                  />
                  <ImageShader
                    image={toImage}
                    fit="cover"
                    width={size.width}
                    height={size.height}
                  />
                </Shader>
              </Fill>
            </Canvas>
          </Animated.View>
        ) : null}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: CURL_BG,
  },
  snapshotLayer: {
    position: 'absolute',
    left: -4000,
    top: 0,
    opacity: 0,
  },
  snapshotPage: {
    marginBottom: 24,
  },
  liveLayer: {
    width: '100%',
    backgroundColor: CURL_BG,
  },
  hidden: {
    opacity: 0,
  },
  canvasWrap: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
