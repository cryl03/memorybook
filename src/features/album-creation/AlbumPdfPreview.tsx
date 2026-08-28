import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import WebView from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';

const PdfWebView = WebView as unknown as React.ComponentType<{
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
import { colors, typography, spacing, borderRadius } from '@core/theme';
import { albumService } from '@core/api';
import { arrayBufferToBase64 } from '@core/api/pdfUrl';
import { getErrorMessage } from '@core/api/errors';

interface AlbumPdfPreviewProps {
  albumId: string;
  page: number;
  /** Change this after a new backend PDF so the viewer reloads. */
  revision?: string;
  onDocumentLoad?: (pageCount: number) => void;
  onError?: (message: string) => void;
}

function viewerHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <style>
    html, body { margin: 0; padding: 0; background: #FAF7F2; height: 100%; }
    #wrap { min-height: 100%; display: flex; align-items: center; justify-content: center; }
    canvas { width: 100%; height: auto; display: block; }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
</head>
<body>
  <div id="wrap"><canvas id="c"></canvas></div>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    var pdfDoc = null;
    var currentPage = 1;
    var renderTask = null;
    var showGen = 0;
    function post(msg) {
      window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    }
    function isCancelled(err) {
      if (!err) return false;
      if (err.name === 'RenderingCancelledException') return true;
      var msg = String(err.message || err);
      return /multiple render|Rendering cancelled|cancelled/i.test(msg);
    }
    function cancelRender() {
      if (!renderTask) return;
      try { renderTask.cancel(); } catch (e) {}
      renderTask = null;
    }
    function renderPage(n) {
      if (!pdfDoc) return;
      var pageNum = Math.min(Math.max(1, n), pdfDoc.numPages);
      currentPage = pageNum;
      cancelRender();
      pdfDoc.getPage(pageNum).then(function(page) {
        var canvas = document.getElementById('c');
        var ctx = canvas.getContext('2d');
        var unscaled = page.getViewport({ scale: 1 });
        var scale = (window.innerWidth / unscaled.width) * (window.devicePixelRatio || 1);
        var viewport = page.getViewport({ scale: scale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = '100%';
        renderTask = page.render({ canvasContext: ctx, viewport: viewport });
        return renderTask.promise;
      }).then(function() {
        renderTask = null;
        post({ type: 'page', page: currentPage, total: pdfDoc.numPages });
      }).catch(function(err) {
        renderTask = null;
        if (isCancelled(err)) return;
        post({ type: 'error', message: String(err && err.message ? err.message : err) });
      });
    }
    function showPdf(b64) {
      var gen = ++showGen;
      cancelRender();
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
        post({ type: 'ready', total: pdf.numPages });
      }).catch(function(err) {
        if (gen !== showGen) return;
        post({ type: 'error', message: String(err && err.message ? err.message : err) });
      });
    }
    window.renderPage = renderPage;
    window.showPdf = showPdf;
  </script>
</body>
</html>`;
}

const VIEWER_HTML = viewerHtml();

export function AlbumPdfPreview({
  albumId,
  page,
  revision,
  onDocumentLoad,
  onError,
}: AlbumPdfPreviewProps) {
  const webRef = useRef<{ injectJavaScript?: (js: string) => void } | null>(
    null,
  );
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const loadGen = useRef(0);
  const base64Ref = useRef<string | null>(null);
  const webReadyRef = useRef(false);
  const injectedRef = useRef<string | null>(null);
  const loadedAlbumRef = useRef<string | null>(null);
  const lastRevisionRef = useRef<string | undefined>(undefined);

  const injectPdf = React.useCallback(() => {
    const data = base64Ref.current;
    if (!data || !webReadyRef.current) return;
    if (injectedRef.current === data) return;
    injectedRef.current = data;
    webRef.current?.injectJavaScript?.(
      `showPdf(${JSON.stringify(data)}); true;`,
    );
  }, []);

  const loadPdf = React.useCallback(async () => {
    if (loadedAlbumRef.current === albumId && base64Ref.current) {
      injectPdf();
      return;
    }

    const gen = ++loadGen.current;
    setLoading(true);
    setError(null);
    setReady(false);
    injectedRef.current = null;
    try {
      console.log('[PDF] preview load start', { albumId });
      const bytes = await albumService.fetchAlbumPdfBytes(albumId);
      if (gen !== loadGen.current) return;
      console.log('[PDF] preview got bytes', bytes.byteLength);
      base64Ref.current = arrayBufferToBase64(bytes);
      loadedAlbumRef.current = albumId;
      injectPdf();
    } catch (err) {
      if (gen !== loadGen.current) return;
      console.warn('[PDF] preview failed', getErrorMessage(err, String(err)), err);
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

  useEffect(() => {
    if (!ready) return;
    webRef.current?.injectJavaScript?.(`renderPage(${page}); true;`);
  }, [page, ready]);

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data) as {
        type?: string;
        total?: number;
        message?: string;
      };
      if (payload.type === 'ready' && payload.total) {
        setReady(true);
        setLoading(false);
        onDocumentLoad?.(payload.total);
      }
      if (payload.type === 'error') {
        const message = payload.message || 'No se pudo mostrar el PDF';
        if (/multiple render|Rendering cancelled|cancelled/i.test(message)) {
          return;
        }
        setLoading(false);
        setError(message);
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

  return (
    <View style={styles.frame}>
      <PdfWebView
        ref={webRef}
        source={{ html: VIEWER_HTML, baseUrl: 'https://cdnjs.cloudflare.com' }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        onLoadEnd={() => {
          webReadyRef.current = true;
          injectPdf();
        }}
        onMessage={onMessage}
        onError={() => {
          setLoading(false);
          setError('No se pudo mostrar el álbum');
        }}
        androidLayerType="hardware"
        mixedContentMode="always"
        allowFileAccess
        allowUniversalAccessFromFileURLs
      />
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.text.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
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
