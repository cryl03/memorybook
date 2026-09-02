import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Image,
  StyleSheet,
  LayoutChangeEvent,
  InteractionManager,
  type StyleProp,
  type ViewStyle,
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
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { PAGE_CURL_SHADER } from './pageCurlShader';

/** Match editor gradient so curl never flashes Skia’s default black */
const CURL_BG = '#F5F8FA';

export type BookPageCurlHandle = {
  goNext: () => void;
  goPrev: () => void;
};

interface BookPageCurlProps {
  currentPage: number;
  pageCount: number;
  onPrev: () => void;
  onNext: () => void;
  renderPage?: (pageIndex: number) => React.ReactNode;
  /** Data URLs (jpeg/png). Skips view snapshots — safe with FLAG_SECURE. */
  pageImages?: (string | null)[];
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
}

type SnapTarget = 'current' | 'next' | 'prev';

function decodeDataUrl(dataUrl: string): SkImage | null {
  try {
    const b64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
    if (!b64) return null;
    const data = Skia.Data.fromBase64(b64);
    return Skia.Image.MakeImageFromEncoded(data);
  } catch {
    return null;
  }
}

export const BookPageCurl = forwardRef<BookPageCurlHandle, BookPageCurlProps>(
  function BookPageCurl(
    {
      currentPage,
      pageCount,
      onPrev,
      onNext,
      renderPage,
      pageImages,
      backgroundColor = CURL_BG,
      style,
    },
    ref,
  ) {
    const imageMode = Boolean(pageImages);
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [isCurling, setIsCurling] = useState(false);
    /** Page shown under the canvas so hide-overlay never flashes the old sheet. */
    const [underlayPage, setUnderlayPage] = useState(currentPage);
    const commitPending = useRef(false);

    const currentRef = useRef<View>(null);
    const nextRef = useRef<View>(null);
    const prevRef = useRef<View>(null);
    const skCache = useRef<Map<string, SkImage>>(new Map());

    const currentImage = useSharedValue<SkImage | null>(null);
    const nextImage = useSharedValue<SkImage | null>(null);
    const prevImage = useSharedValue<SkImage | null>(null);

    const progress = useSharedValue(0);
    const overlayOpacity = useSharedValue(0);
    const topFlag = useSharedValue(1);
    /** 0 = next (peel leftward), 1 = prev (peel rightward) */
    const mirrorX = useSharedValue(0);
    const animDir = useSharedValue<'next' | 'prev'>('next');
    const dirLocked = useSharedValue(false);
    const pageIndex = useSharedValue(currentPage);
    const lastPageIndex = useSharedValue(Math.max(pageCount - 1, 0));
    const isAnimating = useSharedValue(false);
    const canNextSv = useSharedValue(false);
    const canPrevSv = useSharedValue(false);

    const effect = useMemo(() => Skia.RuntimeEffect.Make(PAGE_CURL_SHADER)!, []);

    const getSk = useCallback((dataUrl: string | null | undefined) => {
      if (!dataUrl) return null;
      const cached = skCache.current.get(dataUrl);
      if (cached) return cached;
      const img = decodeDataUrl(dataUrl);
      if (img) skCache.current.set(dataUrl, img);
      return img;
    }, []);

    useEffect(() => {
      pageIndex.value = currentPage;
      lastPageIndex.value = Math.max(pageCount - 1, 0);
    }, [currentPage, lastPageIndex, pageCount, pageIndex]);

    useEffect(() => {
      if (isCurling) return;
      setUnderlayPage(currentPage);
    }, [currentPage, isCurling]);

    useEffect(() => {
      const hasNext =
        currentPage < pageCount - 1 &&
        (!pageImages || Boolean(pageImages[currentPage + 1]));
      const hasPrev =
        currentPage > 0 && (!pageImages || Boolean(pageImages[currentPage - 1]));
      canNextSv.value = hasNext;
      canPrevSv.value = hasPrev;
    }, [canNextSv, canPrevSv, currentPage, pageCount, pageImages]);

    useEffect(() => {
      if (!pageImages) return;
      if (isCurling) return;
      const keep = new Set(pageImages.filter((uri): uri is string => Boolean(uri)));
      for (const key of [...skCache.current.keys()]) {
        if (!keep.has(key)) skCache.current.delete(key);
      }
      currentImage.value = getSk(pageImages[currentPage]);
      nextImage.value =
        currentPage < pageCount - 1 ? getSk(pageImages[currentPage + 1]) : null;
      prevImage.value =
        currentPage > 0 ? getSk(pageImages[currentPage - 1]) : null;
    }, [
      currentImage,
      currentPage,
      getSk,
      nextImage,
      isCurling,
      pageCount,
      pageImages,
      prevImage,
    ]);

    const capture = useCallback(
      async (target: SnapTarget) => {
        const snapRef =
          target === 'current'
            ? currentRef
            : target === 'next'
              ? nextRef
              : prevRef;
        if (!snapRef.current || size.width <= 0) return null;

        await new Promise<void>(resolve => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
          });
        });

        await new Promise<void>(resolve => {
          InteractionManager.runAfterInteractions(() => resolve());
        });

        try {
          return await makeImageFromView(snapRef);
        } catch (error) {
          console.warn('Page curl snapshot failed:', error);
          return null;
        }
      },
      [size.width],
    );

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
      if (imageMode) return;
      if (isCurling) return;
      if (size.width <= 0) return;
      const timer = setTimeout(() => {
        void refreshSnapshots();
      }, 80);
      return () => clearTimeout(timer);
    }, [currentPage, imageMode, isCurling, refreshSnapshots, size]);

    const finishCurl = useCallback(
      (direction: 'next' | 'prev') => {
        // Hide overlay first. Keep progress at 1 so we never flash the old sheet.
        overlayOpacity.value = 0;
        isAnimating.value = false;
        commitPending.current = true;
        if (direction === 'next') onNext();
        else onPrev();
      },
      [isAnimating, onNext, onPrev, overlayOpacity],
    );

    useLayoutEffect(() => {
      if (!commitPending.current) return;
      commitPending.current = false;
      overlayOpacity.value = 0;
      progress.value = 0;
      isAnimating.value = false;
      setIsCurling(false);
    }, [currentPage, isAnimating, overlayOpacity, progress]);

    const startCurlOverlay = useCallback((direction: 'next' | 'prev') => {
      const dest =
        direction === 'next'
          ? Math.min(currentPage + 1, pageCount - 1)
          : Math.max(currentPage - 1, 0);
      overlayOpacity.value = 1;
      setUnderlayPage(dest);
      setIsCurling(true);
    }, [currentPage, overlayOpacity, pageCount]);

    const cancelCurl = useCallback(() => {
      overlayOpacity.value = 0;
      progress.value = 0;
      setUnderlayPage(currentPage);
      setIsCurling(false);
    }, [currentPage, overlayOpacity, progress]);

    const playCurl = useCallback(
      (direction: 'next' | 'prev') => {
        if (isAnimating.value) return;
        const can =
          direction === 'next' ? canNextSv.value : canPrevSv.value;
        if (!can) return;

        animDir.value = direction;
        mirrorX.value = direction === 'next' ? 0 : 1;
        dirLocked.value = true;
        startCurlOverlay(direction);
        isAnimating.value = true;
        progress.value = withTiming(1, { duration: 420 }, finished => {
          if (finished) {
            dirLocked.value = false;
            runOnJS(finishCurl)(direction);
          }
        });
      },
      [
        animDir,
        canNextSv,
        canPrevSv,
        startCurlOverlay,
        dirLocked,
        finishCurl,
        isAnimating,
        mirrorX,
        progress,
      ],
    );

    useImperativeHandle(
      ref,
      () => ({
        goNext: () => playCurl('next'),
        goPrev: () => playCurl('prev'),
      }),
      [playCurl],
    );

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

        const canGoPrev = canPrevSv.value;
        const canGoNext = canNextSv.value;
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
          runOnJS(startCurlOverlay)(wantsNext ? 'next' : 'prev');
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

        const canGoPrev = canPrevSv.value;
        const canGoNext = canNextSv.value;
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

        progress.value = withSpring(
          0,
          { damping: 18, stiffness: 160 },
          finished => {
            if (finished) {
              dirLocked.value = false;
              runOnJS(cancelCurl)();
            }
          },
        );
      });

    const overlayStyle = useAnimatedStyle(() => ({
      opacity: overlayOpacity.value,
    }));

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
    const livePage = isCurling ? underlayPage : currentPage;
    const currentUri = pageImages?.[livePage] ?? null;

    const liveContent = imageMode ? (
      currentUri ? (
        <Image
          source={{ uri: currentUri }}
          style={styles.pageImage}
          resizeMode="cover"
          fadeDuration={0}
        />
      ) : null
    ) : (
      renderPage?.(livePage)
    );

    return (
      <GestureDetector gesture={pan}>
        <View
          style={[
            styles.container,
            { backgroundColor },
            imageMode && styles.fill,
            style,
          ]}
          onLayout={onLayout}>
          {!imageMode && hasSize && renderPage ? (
            <View style={styles.snapshotLayer} pointerEvents="none">
              <View
                ref={currentRef}
                collapsable={false}
                style={[
                  styles.snapshotPage,
                  {
                    width: size.width,
                    height: size.height,
                    backgroundColor,
                  },
                ]}>
                {renderPage(currentPage)}
              </View>
              {currentPage < pageCount - 1 ? (
                <View
                  ref={nextRef}
                  collapsable={false}
                  style={[
                    styles.snapshotPage,
                    {
                      width: size.width,
                      height: size.height,
                      backgroundColor,
                    },
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
                    {
                      width: size.width,
                      height: size.height,
                      backgroundColor,
                    },
                  ]}>
                  {renderPage(prevPage)}
                </View>
              ) : null}
            </View>
          ) : null}

          <View
            style={[
              styles.liveLayer,
              { backgroundColor },
              imageMode && styles.fill,
            ]}
            pointerEvents="box-none">
            {liveContent}
          </View>

          {hasSize ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.canvasWrap,
                {
                  width: size.width,
                  height: size.height,
                  backgroundColor,
                },
                overlayStyle,
              ]}>
              <Canvas style={{ width: size.width, height: size.height }}>
                <Fill color={backgroundColor} />
                {isCurling ? (
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
                ) : null}
              </Canvas>
            </Animated.View>
          ) : null}
        </View>
      </GestureDetector>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: CURL_BG,
  },
  fill: {
    flex: 1,
    height: '100%',
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
  pageImage: {
    width: '100%',
    height: '100%',
  },
  canvasWrap: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
