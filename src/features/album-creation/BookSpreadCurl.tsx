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
import { View, Image, StyleSheet, LayoutChangeEvent } from 'react-native';
import {
  Canvas,
  Fill,
  ImageShader,
  Shader,
  Skia,
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
import { PAGE_CURL_SHADER } from '../editor/components/pageCurlShader';
import type { BookPageCurlHandle } from '../editor/components/BookPageCurl';

const PAPER = '#FAF7F2';
const FULL_RECT: [number, number, number, number] = [0, 0, 1, 1];

function containRect(
  imgW: number,
  imgH: number,
  paneW: number,
  paneH: number,
): [number, number, number, number] {
  if (imgW <= 0 || imgH <= 0 || paneW <= 0 || paneH <= 0) return FULL_RECT;
  const scale = Math.min(paneW / imgW, paneH / imgH);
  const dw = (imgW * scale) / paneW;
  const dh = (imgH * scale) / paneH;
  return [(1 - dw) / 2, (1 - dh) / 2, dw, dh];
}

export type AlbumView = {
  kind: 'cover' | 'spread' | 'back';
  left: number;
  right: number | null;
};

export function buildAlbumViews(pageCount: number): AlbumView[] {
  if (pageCount <= 0) return [];
  const views: AlbumView[] = [{ kind: 'cover', left: 0, right: null }];
  const last = pageCount - 1;
  for (let i = 1; i < last; ) {
    const hasRight = i + 1 < last;
    views.push({
      kind: 'spread',
      left: i,
      right: hasRight ? i + 1 : null,
    });
    i += hasRight ? 2 : 1;
  }
  if (pageCount >= 2) {
    views.push({ kind: 'back', left: last, right: null });
  }
  return views;
}

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

function viewUri(
  pages: (string | null)[],
  view: AlbumView | undefined,
  side: 'left' | 'right' | 'leaf',
): string | null {
  if (!view) return null;
  if (side === 'left') return pages[view.left] ?? null;
  if (side === 'right') {
    return view.right != null ? pages[view.right] ?? null : null;
  }
  return view.right != null
    ? pages[view.right] ?? null
    : pages[view.left] ?? null;
}

interface BookSpreadCurlProps {
  pages: (string | null)[];
  viewIndex: number;
  views: AlbumView[];
  onNext: () => void;
  onPrev: () => void;
  onCurlStart?: () => void;
  onCurlEnd?: () => void;
}

export const BookSpreadCurl = forwardRef<BookPageCurlHandle, BookSpreadCurlProps>(
  function BookSpreadCurl(
    { pages, viewIndex, views, onNext, onPrev, onCurlStart, onCurlEnd },
    ref,
  ) {
    const viewCount = views.length;
    const view = views[viewIndex];
    const [isCurling, setIsCurling] = useState(false);
    const [curlDir, setCurlDir] = useState<'next' | 'prev'>('next');
    const [box, setBox] = useState({ width: 0, height: 0 });
    const commitPending = useRef(false);
    const onCurlStartRef = useRef(onCurlStart);
    const onCurlEndRef = useRef(onCurlEnd);
    onCurlStartRef.current = onCurlStart;
    onCurlEndRef.current = onCurlEnd;

    const skCache = useRef<Map<string, SkImage>>(new Map());
    const fromImage = useSharedValue<SkImage | null>(null);
    const toImage = useSharedValue<SkImage | null>(null);
    const fromRect = useSharedValue<[number, number, number, number]>(FULL_RECT);
    const toRect = useSharedValue<[number, number, number, number]>(FULL_RECT);
    const progress = useSharedValue(0);
    const overlayOpacity = useSharedValue(0);
    const topFlag = useSharedValue(1);
    const mirrorX = useSharedValue(0);
    const animDir = useSharedValue<'next' | 'prev'>('next');
    const dirLocked = useSharedValue(false);
    const isAnimating = useSharedValue(false);
    const canNextSv = useSharedValue(false);
    const canPrevSv = useSharedValue(false);

    const effect = useMemo(() => Skia.RuntimeEffect.Make(PAGE_CURL_SHADER), []);

    const getSk = useCallback((dataUrl: string | null | undefined) => {
      if (!dataUrl) return null;
      const cached = skCache.current.get(dataUrl);
      if (cached) return cached;
      const img = decodeDataUrl(dataUrl);
      if (img) skCache.current.set(dataUrl, img);
      return img;
    }, []);

    const destIndex = useCallback(
      (direction: 'next' | 'prev') => {
        if (direction === 'next') return Math.min(viewIndex + 1, viewCount - 1);
        return Math.max(viewIndex - 1, 0);
      },
      [viewCount, viewIndex],
    );

    const opening =
      isCurling && curlDir === 'next' && view?.kind === 'cover';
    const open = view?.kind === 'spread' || opening;
    const liveView =
      isCurling && curlDir === 'next'
        ? views[destIndex('next')] ?? view
        : view;
    const leftUri = opening
      ? viewUri(pages, liveView, 'left')
      : viewUri(pages, view, 'left');
    const rightUri = open
      ? isCurling && curlDir === 'next'
        ? viewUri(pages, liveView, 'right') ?? viewUri(pages, liveView, 'leaf')
        : viewUri(pages, view, 'right') ?? viewUri(pages, view, 'leaf')
      : viewUri(pages, view, 'leaf');

    const SPINE = 2;
    const paneW =
      open && box.width > 0 ? (box.width - SPINE) / 2 : box.width;
    const paneH = box.height;
    const paneSize = { width: Math.max(paneW, 0), height: Math.max(paneH, 0) };

    useEffect(() => {
      canNextSv.value =
        viewIndex < viewCount - 1 &&
        Boolean(viewUri(pages, views[viewIndex + 1], 'leaf'));
      canPrevSv.value =
        viewIndex > 0 && Boolean(viewUri(pages, views[viewIndex - 1], 'leaf'));
    }, [canNextSv, canPrevSv, pages, viewCount, viewIndex, views]);

    const loadCurlImages = useCallback(
      (direction: 'next' | 'prev') => {
        const current = views[viewIndex];
        const dest = views[destIndex(direction)];
        const fromUri =
          direction === 'next'
            ? viewUri(pages, current, 'leaf')
            : viewUri(pages, current, 'left');
        const toUri =
          direction === 'next'
            ? viewUri(pages, dest, dest?.kind === 'spread' ? 'right' : 'leaf')
            : viewUri(pages, dest, dest?.kind === 'spread' ? 'left' : 'leaf');
        const from = getSk(fromUri);
        const to = getSk(toUri ?? fromUri);
        fromImage.value = from;
        toImage.value = to;
        fromRect.value = from
          ? containRect(from.width(), from.height(), paneSize.width, paneSize.height)
          : FULL_RECT;
        toRect.value = to
          ? containRect(to.width(), to.height(), paneSize.width, paneSize.height)
          : FULL_RECT;
        return Boolean(from && to);
      },
      [
        destIndex,
        fromImage,
        fromRect,
        getSk,
        pages,
        paneSize.height,
        paneSize.width,
        toImage,
        toRect,
        viewIndex,
        views,
      ],
    );

    const finishCurl = useCallback(
      (direction: 'next' | 'prev') => {
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
      onCurlEndRef.current?.();
    }, [isAnimating, overlayOpacity, progress, viewIndex]);

    const startCurlOverlay = useCallback(
      (direction: 'next' | 'prev') => {
        if (!loadCurlImages(direction)) {
          dirLocked.value = false;
          return false;
        }
        animDir.value = direction;
        mirrorX.value = direction === 'next' ? 0 : 1;
        overlayOpacity.value = 0;
        setCurlDir(direction);
        setIsCurling(true);
        onCurlStartRef.current?.();
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            overlayOpacity.value = 1;
          });
        });
        return true;
      },
      [animDir, dirLocked, loadCurlImages, mirrorX, overlayOpacity],
    );

    const cancelCurl = useCallback(() => {
      overlayOpacity.value = 0;
      progress.value = 0;
      setIsCurling(false);
      onCurlEndRef.current?.();
    }, [overlayOpacity, progress]);

    const playCurl = useCallback(
      (direction: 'next' | 'prev') => {
        if (isAnimating.value) return;
        const can = direction === 'next' ? canNextSv.value : canPrevSv.value;
        if (!can) return;
        dirLocked.value = true;
        if (!startCurlOverlay(direction)) return;
        isAnimating.value = true;
        progress.value = withTiming(1, { duration: 420 }, finished => {
          if (finished) {
            dirLocked.value = false;
            runOnJS(finishCurl)(direction);
          }
        });
      },
      [
        canNextSv,
        canPrevSv,
        dirLocked,
        finishCurl,
        isAnimating,
        progress,
        startCurlOverlay,
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
        topFlag.value = event.y < paneSize.height / 2 ? 0 : 1;
        dirLocked.value = false;
        progress.value = 0;
      })
      .onUpdate(event => {
        if (isAnimating.value) return;
        const x = event.translationX;
        const absX = Math.abs(x);
        if (!dirLocked.value && absX > 10) {
          const wantsNext = x < 0;
          if (
            (wantsNext && !canNextSv.value) ||
            (!wantsNext && !canPrevSv.value)
          ) {
            progress.value = Math.min(absX / Math.max(paneSize.width, 1), 0.12);
            return;
          }
          dirLocked.value = true;
          runOnJS(startCurlOverlay)(wantsNext ? 'next' : 'prev');
        }
        if (!dirLocked.value) return;
        if (animDir.value === 'next') {
          progress.value = Math.min(
            Math.max(-x, 0) / Math.max(paneSize.width, 1),
            1,
          );
        } else {
          progress.value = Math.min(
            Math.max(x, 0) / Math.max(paneSize.width, 1),
            1,
          );
        }
      })
      .onEnd(event => {
        if (isAnimating.value) return;
        const shouldCommit =
          progress.value > 0.28 ||
          (animDir.value === 'next' && event.velocityX < -850) ||
          (animDir.value === 'prev' && event.velocityX > 850);
        const goingNext = animDir.value === 'next' && canNextSv.value;
        const goingPrev = animDir.value === 'prev' && canPrevSv.value;
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
      resolution: [Math.max(paneSize.width, 1), Math.max(paneSize.height, 1)],
      progress: progress.value,
      topFlag: topFlag.value,
      mirrorX: mirrorX.value,
      fromRect: fromRect.value,
      toRect: toRect.value,
    }));

    const onRootLayout = (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      if (width > 0 && height > 0) {
        setBox({ width, height });
      }
    };

    const curlOnLeft = isCurling && curlDir === 'prev' && open;
    const curlOnRight = isCurling && (curlDir === 'next' || !open);
    const hasPane = paneSize.width > 0 && paneSize.height > 0;

    const curlCanvas =
      hasPane && isCurling && effect ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.canvasWrap,
            {
              width: paneSize.width,
              height: paneSize.height,
              backgroundColor: PAPER,
            },
            overlayStyle,
          ]}>
          <Canvas
            style={{
              width: paneSize.width,
              height: paneSize.height,
              backgroundColor: PAPER,
            }}>
            <Fill color={PAPER} />
            <Fill>
              <Shader source={effect} uniforms={uniforms}>
                <ImageShader
                  image={fromImage}
                  fit="fill"
                  tx="clamp"
                  ty="clamp"
                  width={paneSize.width}
                  height={paneSize.height}
                />
                <ImageShader
                  image={toImage}
                  fit="fill"
                  tx="clamp"
                  ty="clamp"
                  width={paneSize.width}
                  height={paneSize.height}
                />
              </Shader>
            </Fill>
          </Canvas>
        </Animated.View>
      ) : null;

    const pageImg = (uri: string | null, w: number, h: number) =>
      uri ? (
        <Image
          source={{ uri }}
          style={{ width: w, height: h }}
          resizeMode="contain"
          fadeDuration={0}
        />
      ) : (
        <View style={{ width: w, height: h, backgroundColor: PAPER }} />
      );

    const paneStyle = {
      width: paneW,
      height: paneH,
      overflow: 'hidden' as const,
      backgroundColor: PAPER,
    };

    return (
      <GestureDetector gesture={pan}>
        <View style={styles.root} onLayout={onRootLayout}>
          {open ? (
            <View style={[styles.spread, { width: box.width, height: box.height }]}>
              <View style={paneStyle} collapsable={false}>
                {pageImg(leftUri, paneW, paneH)}
                {curlOnLeft ? curlCanvas : null}
              </View>
              <View style={[styles.spine, { width: SPINE, height: paneH }]} />
              <View style={paneStyle} collapsable={false}>
                {pageImg(rightUri, paneW, paneH)}
                {curlOnRight ? curlCanvas : null}
              </View>
            </View>
          ) : (
            <View
              style={[styles.closedWrap, { width: box.width, height: box.height }]}
              collapsable={false}>
              {pageImg(rightUri, box.width, box.height)}
              {isCurling ? curlCanvas : null}
            </View>
          )}
        </View>
      </GestureDetector>
    );
  },
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: PAPER,
  },
  spread: {
    flexDirection: 'row',
  },
  spine: {
    backgroundColor: 'rgba(0,0,0,0.16)',
  },
  closedWrap: {
    backgroundColor: PAPER,
    overflow: 'hidden',
  },
  canvasWrap: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
