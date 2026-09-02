import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  PixelRatio,
  Dimensions,
} from 'react-native';
import WebView from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import { colors, typography, spacing, borderRadius } from '@core/theme';
import { albumService } from '@core/api';
import { arrayBufferToBase64 } from '@core/api/pdfUrl';
import { getErrorMessage } from '@core/api/errors';
import {
  BookPageCurl,
  type BookPageCurlHandle,
} from '../editor/components/BookPageCurl';
import { AlbumPdfPreview } from './AlbumPdfPreview';

const RasterWebView = WebView as unknown as React.ComponentType<{
  ref?: React.Ref<unknown>;
  source?: { html: string; baseUrl?: string };
  style?: object;
  originWhitelist?: string[];
  javaScriptEnabled?: boolean;
  onLoadEnd?: () => void;
  onMessage?: (event: WebViewMessageEvent) => void;
  onError?: () => void;
  androidLayerType?: string;
  mixedContentMode?: string;
  allowFileAccess?: boolean;
  allowUniversalAccessFromFileURLs?: boolean;
}>;

export type AlbumPdfFlipbookHandle = {
  goNext: () => void;
  goPrev: () => void;
};

interface AlbumPdfFlipbookProps {
  albumId: string;
  page: number;
  revision?: string;
  onDocumentLoad?: (sheetCount: number, pdfPages?: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onError?: (message: string) => void;
  onCurlStart?: () => void;
  onCurlEnd?: () => void;
}

function rasterHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <style>html, body { margin: 0; padding: 0; background: #FAF7F2; }</style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
</head>
<body>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    var pdfDoc = null;
    var showGen = 0;
    function post(msg) {
      window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    }
    function renderPdfPage(n, pageWidth) {
      return pdfDoc.getPage(n).then(function(page) {
        var unscaled = page.getViewport({ scale: 1 });
        var scale = pageWidth / unscaled.width;
        var viewport = page.getViewport({ scale: scale });
        var canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function() {
          return canvas;
        });
      });
    }
    function toJpeg(canvas) {
      return canvas.toDataURL('image/jpeg', 0.85);
    }
    function makeSpread(leftCanvas, rightCanvas) {
      var w = leftCanvas.width;
      var h = leftCanvas.height;
      var out = document.createElement('canvas');
      out.width = w * 2;
      out.height = h;
      var ctx = out.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(leftCanvas, 0, 0, w, h);
      if (rightCanvas) ctx.drawImage(rightCanvas, w, 0, w, h);
      ctx.fillStyle = 'rgba(0,0,0,0.14)';
      ctx.fillRect(w - 1, 0, 3, h);
      return out;
    }
    function makeClosed(coverCanvas, spineLeft) {
      var w = coverCanvas.width;
      var h = coverCanvas.height;
      var out = document.createElement('canvas');
      out.width = w * 2;
      out.height = h;
      var ctx = out.getContext('2d');
      ctx.fillStyle = '#FAF7F2';
      ctx.fillRect(0, 0, out.width, out.height);
      var x = Math.floor(w / 2);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(x + 5, 8, w, h - 8);
      ctx.drawImage(coverCanvas, x, 0, w, h);
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      if (spineLeft) ctx.fillRect(x, 0, 10, h);
      else ctx.fillRect(x + w - 10, 0, 10, h);
      return out;
    }
    function rasterAll(targetWidth) {
      if (!pdfDoc) return;
      var nPages = pdfDoc.numPages;
      var width = Math.max(320, targetWidth || 900);
      var sheets = [{ kind: 'cover', left: 1, right: 0 }];
      for (var i = 2; i <= nPages - 1; i += 2) {
        sheets.push({
          kind: 'spread',
          left: i,
          right: i + 1 <= nPages - 1 ? i + 1 : 0,
        });
      }
      if (nPages >= 2) sheets.push({ kind: 'back', left: nPages, right: 0 });
      post({ type: 'ready', total: sheets.length, pdfPages: nPages });
      var s = 0;
      function next() {
        if (s >= sheets.length) {
          post({ type: 'rasterDone', total: sheets.length });
          return;
        }
        var sheet = sheets[s];
        var jobs = [renderPdfPage(sheet.left, width)];
        if (sheet.right) jobs.push(renderPdfPage(sheet.right, width));
        Promise.all(jobs).then(function(canvases) {
          var out = sheet.kind === 'spread'
            ? makeSpread(canvases[0], canvases[1] || null)
            : makeClosed(canvases[0], sheet.kind === 'cover');
          post({
            type: 'rasterPage',
            page: s + 1,
            total: sheets.length,
            data: toJpeg(out),
            kind: sheet.kind,
          });
          out.width = 0;
          out.height = 0;
          canvases.forEach(function(c) { c.width = 0; c.height = 0; });
          s += 1;
          setTimeout(next, 0);
        }).catch(function(err) {
          post({ type: 'error', message: String(err && err.message ? err.message : err) });
        });
      }
      next();
    }
    function showPdf(b64, targetWidth) {
      var gen = ++showGen;
      pdfDoc = null;
      var raw = atob(b64);
      var bytes = new Uint8Array(raw.length);
      for (var i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      pdfjsLib.getDocument({ data: bytes, disableWorker: true }).promise.then(function(pdf) {
        if (gen !== showGen) {
          try { pdf.destroy(); } catch (e) {}
          return;
        }
        pdfDoc = pdf;
        rasterAll(targetWidth);
      }).catch(function(err) {
        if (gen !== showGen) return;
        post({ type: 'error', message: String(err && err.message ? err.message : err) });
      });
    }
    window.showPdf = showPdf;
  </script>
</body>
</html>`;
}

const RASTER_HTML = rasterHtml();
const OPEN_W = Dimensions.get('window').width * 0.92;
const TARGET_WIDTH = Math.min(
  Math.round((OPEN_W / 2) * PixelRatio.get()),
  1100,
);

export const AlbumPdfFlipbook = forwardRef<
  AlbumPdfFlipbookHandle,
  AlbumPdfFlipbookProps
>(function AlbumPdfFlipbook(
  { albumId, page, revision, onDocumentLoad, onNext, onPrev, onError, onCurlStart, onCurlEnd },
  ref,
) {
  const webRef = useRef<{ injectJavaScript?: (js: string) => void } | null>(
    null,
  );
  const curlRef = useRef<BookPageCurlHandle>(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const onDocumentLoadRef = useRef(onDocumentLoad);
  onDocumentLoadRef.current = onDocumentLoad;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rasterFailed, setRasterFailed] = useState(false);
  const [images, setImages] = useState<(string | null)[]>([]);
  const [pageCount, setPageCount] = useState(0);

  const loadGen = useRef(0);
  const base64Ref = useRef<string | null>(null);
  const webReadyRef = useRef(false);
  const injectedRef = useRef<string | null>(null);
  const loadedAlbumRef = useRef<string | null>(null);
  const lastRevisionRef = useRef<string | undefined>(undefined);

  const failRaster = useCallback((message: string) => {
    console.warn('[PDF] raster failed', message);
    setRasterFailed(true);
    setLoading(false);
    setError(null);
  }, []);

  const injectPdf = useCallback(() => {
    const data = base64Ref.current;
    if (!data || !webReadyRef.current) return;
    if (injectedRef.current === data) return;
    injectedRef.current = data;
    webRef.current?.injectJavaScript?.(
      `showPdf(${JSON.stringify(data)}, ${TARGET_WIDTH}); true;`,
    );
  }, []);

  const loadPdf = useCallback(async () => {
    if (loadedAlbumRef.current === albumId && base64Ref.current) {
      injectPdf();
      return;
    }

    const gen = ++loadGen.current;
    setLoading(true);
    setError(null);
    setRasterFailed(false);
    setImages([]);
    setPageCount(0);
    injectedRef.current = null;
    try {
      const bytes = await albumService.fetchAlbumPdfBytes(albumId);
      if (gen !== loadGen.current) return;
      base64Ref.current = arrayBufferToBase64(bytes);
      loadedAlbumRef.current = albumId;
      injectPdf();
    } catch (err) {
      if (gen !== loadGen.current) return;
      setLoading(false);
      const message = getErrorMessage(err, 'No se pudo cargar el álbum');
      setError(message);
      onErrorRef.current?.(message);
    }
  }, [albumId, injectPdf]);

  useEffect(() => {
    void loadPdf();
  }, [loadPdf]);

  useEffect(() => {
    if (!revision) return;
    if (lastRevisionRef.current === undefined) {
      lastRevisionRef.current = revision;
      return;
    }
    if (lastRevisionRef.current === revision) return;
    lastRevisionRef.current = revision;
    loadedAlbumRef.current = null;
    injectedRef.current = null;
    base64Ref.current = null;
    void loadPdf();
  }, [revision, loadPdf]);

  useImperativeHandle(
    ref,
    () => ({
      goNext: () => {
        if (rasterFailed) onNext();
        else curlRef.current?.goNext();
      },
      goPrev: () => {
        if (rasterFailed) onPrev();
        else curlRef.current?.goPrev();
      },
    }),
    [onNext, onPrev, rasterFailed],
  );

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data) as {
        type?: string;
        page?: number;
        total?: number;
        pdfPages?: number;
        data?: string;
        message?: string;
      };
      if (payload.type === 'ready' && payload.total) {
        setPageCount(payload.total);
        setImages(Array(payload.total).fill(null));
        onDocumentLoadRef.current?.(payload.total, payload.pdfPages);
      }
      if (payload.type === 'rasterPage' && payload.page && payload.data) {
        const index = payload.page - 1;
        setImages(prev => {
          const total = payload.total || prev.length;
          const next =
            prev.length === total ? [...prev] : Array(total).fill(null);
          next[index] = payload.data as string;
          return next;
        });
        setLoading(false);
      }
      if (payload.type === 'rasterDone') {
        setLoading(false);
      }
      if (payload.type === 'error') {
        const message = payload.message || 'No se pudo mostrar el PDF';
        failRaster(message);
      }
    } catch {
      // ignore
    }
  };

  if (error) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>{error}</Text>
        <TouchableOpacity onPress={() => void loadPdf()}>
          <Text style={styles.retry}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (rasterFailed) {
    return (
      <AlbumPdfPreview
        albumId={albumId}
        page={page}
        revision={revision}
        onDocumentLoad={onDocumentLoad}
        onError={onError}
      />
    );
  }

  const currentUri = images[page - 1];

  return (
    <View style={styles.frame}>
      <View style={styles.hiddenWebWrap} pointerEvents="none" collapsable={false}>
        <RasterWebView
          ref={webRef}
          source={{ html: RASTER_HTML, baseUrl: 'https://cdnjs.cloudflare.com' }}
          style={styles.hiddenWeb}
          originWhitelist={['*']}
          javaScriptEnabled
          onLoadEnd={() => {
            webReadyRef.current = true;
            injectPdf();
          }}
          onMessage={onMessage}
          onError={() => failRaster('No se pudo mostrar el álbum')}
          androidLayerType="hardware"
          mixedContentMode="always"
          allowFileAccess
          allowUniversalAccessFromFileURLs
        />
      </View>
      {currentUri && pageCount > 0 ? (
        <BookPageCurl
          ref={curlRef}
          currentPage={page - 1}
          pageCount={pageCount}
          pageImages={images}
          onNext={onNext}
          onPrev={onPrev}
          onCurlStart={onCurlStart}
          onCurlEnd={onCurlEnd}
          backgroundColor="#FAF7F2"
        />
      ) : null}
      {loading || !currentUri ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.text.primary} />
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: '#FAF7F2',
  },
  hiddenWebWrap: {
    position: 'absolute',
    left: -4000,
    top: 0,
    width: 400,
    height: 600,
    opacity: 0,
  },
  hiddenWeb: {
    width: 400,
    height: 600,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(250,247,242,0.7)',
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  fallbackText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  retry: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    textDecorationLine: 'underline',
  },
});
