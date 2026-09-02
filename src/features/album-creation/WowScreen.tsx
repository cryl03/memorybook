import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { icons } from '@core/assets/icons';
import { colors, typography, spacing, borderRadius } from '@core/theme';
import { useAppSelector } from '@core/store/hooks';
import {
  AlbumPdfFlipbook,
  type AlbumPdfFlipbookHandle,
} from './AlbumPdfFlipbook';

const { width } = Dimensions.get('window');
const OPEN_W = width * 0.92;
const PAGE_W = OPEN_W / 2;
const OPEN_H = PAGE_W * 1.38;

interface WowScreenProps {
  albumTitle: string;
  onBack?: () => void;
  onEdit?: () => void;
  onBuy: () => void;
  onSave: () => void | Promise<void>;
  onAddPhotos: () => void;
}

export function WowScreen({
  albumTitle,
  onBack,
  onBuy,
  onSave,
  onAddPhotos,
}: WowScreenProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const album = useAppSelector(state => state.album);
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const photos = album.currentAlbum?.photos || [];
  const coverPhoto = photos[0] || null;
  const remoteId = album.currentAlbum?.remoteId;
  const pdfRevision = album.currentAlbum?.pdfUrl;
  const [pdfPage, setPdfPage] = React.useState(1);
  const [pdfPageCount, setPdfPageCount] = React.useState(0);
  const [pdfPages, setPdfPages] = React.useState(0);
  const [pdfFailed, setPdfFailed] = React.useState(false);
  const [isCurling, setIsCurling] = React.useState(false);
  const flipRef = React.useRef<AlbumPdfFlipbookHandle>(null);
  const showPdf = Boolean(isAuthenticated && remoteId && !pdfFailed);
  const photoPageCount = photos.length;
  const visiblePageCount = showPdf ? pdfPageCount : photoPageCount;
  const coverUri = showPdf
    ? coverPhoto
    : photos[Math.max(0, pdfPage - 1)] || coverPhoto;

  React.useEffect(() => {
    setPdfPage(1);
    setPdfPageCount(0);
    setPdfPages(0);
    setPdfFailed(false);
    setIsCurling(false);
  }, [remoteId]);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  const isClosedSheet =
    showPdf &&
    (pdfPageCount <= 1 || pdfPage <= 1 || pdfPage >= pdfPageCount);
  const bookOpen = showPdf && (!isClosedSheet || isCurling);
  const pageLabel = !showPdf
    ? visiblePageCount > 0
      ? `${pdfPage} / ${visiblePageCount}`
      : 'Portada'
    : pdfPage <= 1
      ? 'Portada'
      : pdfPage >= visiblePageCount
        ? 'Contraportada'
        : `${pdfPage} / ${visiblePageCount}`;

  return (
    <LinearGradient
      colors={['#FAF7F2', '#FAF7F2']}
      style={styles.container}>
      {onBack ? (
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          accessibilityLabel="Volver"
          accessibilityRole="button">
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
      ) : null}
      {/* Libro: cerrado en portada/contraportada, abierto en spreads */}
      <View style={styles.bookWrapper}>
        {showPdf && remoteId ? (
          <View
            style={[
              styles.bookClip,
              bookOpen ? styles.bookClipOpen : styles.bookClipClosed,
            ]}>
            <View style={styles.bookInner}>
              <AlbumPdfFlipbook
                ref={flipRef}
                albumId={remoteId}
                page={pdfPage}
                revision={pdfRevision}
                onDocumentLoad={(sheets, pdfTotal) => {
                  setPdfPageCount(sheets);
                  if (pdfTotal) setPdfPages(pdfTotal);
                }}
                onNext={() =>
                  setPdfPage(p =>
                    pdfPageCount > 0 ? Math.min(p + 1, pdfPageCount) : p + 1,
                  )
                }
                onPrev={() => setPdfPage(p => Math.max(1, p - 1))}
                onCurlStart={() => setIsCurling(true)}
                onCurlEnd={() => setIsCurling(false)}
                onError={() => {
                  setPdfFailed(true);
                  setPdfPage(1);
                }}
              />
            </View>
          </View>
        ) : (
          <View style={styles.bookCover}>
            <View style={styles.bookPhotoFrame}>
              {coverUri ? (
                <Image
                  source={{ uri: coverUri }}
                  style={styles.bookPhoto}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.bookPhotoPlaceholder} />
              )}
            </View>
            <View style={styles.bookTextLines}>
              <View style={styles.textLine} />
              <View style={[styles.textLine, { width: '70%' }]} />
              <View style={[styles.textLine, { width: '50%' }]} />
            </View>
          </View>
        )}
      </View>

      <Text style={styles.albumTitle}>{albumTitle}</Text>
      <View style={styles.metaRow}>
        {visiblePageCount > 0 ? (
          <Text style={styles.albumMeta}>
            {showPdf
              ? `${pdfPages || pdfPageCount} páginas`
              : `${photoPageCount} foto${photoPageCount === 1 ? '' : 's'}`}
          </Text>
        ) : (
          <View />
        )}
        <TouchableOpacity
          style={styles.addPhotosChip}
          onPress={onAddPhotos}
          accessibilityLabel="Agregar fotos"
          accessibilityRole="button">
          <Text style={styles.addPhotosText}>Agregar fotos</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.spacer} />

      {/* Páginas del PDF del backend — no del editor local */}
      <View style={styles.pageNav}>
        <TouchableOpacity
          disabled={visiblePageCount <= 1 || pdfPage <= 1}
          onPress={() => {
            if (showPdf) flipRef.current?.goPrev();
            else setPdfPage(p => Math.max(1, p - 1));
          }}
          style={styles.navArrow}
          accessibilityLabel="Página anterior">
          <Image
            source={icons['arrow-right']}
            style={{
              width: 20,
              height: 20,
              tintColor:
                visiblePageCount > 1 && pdfPage > 1
                  ? colors.text.primary
                  : colors.text.tertiary,
              transform: [{ rotate: '180deg' }],
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.pageIndicator}>{pageLabel}</Text>
        <TouchableOpacity
          disabled={visiblePageCount === 0 || pdfPage >= visiblePageCount}
          onPress={() => {
            if (showPdf) flipRef.current?.goNext();
            else setPdfPage(p => Math.min(visiblePageCount, p + 1));
          }}
          style={styles.navArrow}
          accessibilityLabel="Página siguiente"
          accessibilityRole="button">
          <Image
            source={icons['arrow-right']}
            style={{
              width: 20,
              height: 20,
              tintColor:
                visiblePageCount > 0 && pdfPage < visiblePageCount
                  ? colors.text.primary
                  : colors.text.tertiary,
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.buyButton} onPress={onBuy}>
          <Text style={styles.buyButtonText}>Llevarlo conmigo - $300</Text>
          <Image
            source={icons.badge}
            style={styles.buyButtonIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isSaving}>
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing['4xl'],
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing['3xl'],
    marginBottom: spacing.md,
  },
  backText: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  bookWrapper: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  bookCover: {
    width: width * 0.78,
    height: width * 1.05,
    borderRadius: borderRadius.sm,
    backgroundColor: '#A8C4D9',
    alignItems: 'center',
    paddingTop: spacing['4xl'],
    paddingHorizontal: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  bookClip: {
    overflow: 'hidden',
    alignItems: 'center',
    borderRadius: borderRadius.sm,
    backgroundColor: '#FAF7F2',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  bookClipClosed: {
    width: PAGE_W,
    height: OPEN_H,
  },
  bookClipOpen: {
    width: OPEN_W,
    height: OPEN_H,
  },
  bookInner: {
    width: OPEN_W,
    height: OPEN_H,
  },
  bookPhotoFrame: {
    width: '55%',
    aspectRatio: 1,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    marginBottom: spacing.xl,
  },
  bookPhoto: {
    width: '100%',
    height: '100%',
  },
  bookPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceSecondary,
  },
  bookTextLines: {
    width: '80%',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  textLine: {
    width: '90%',
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 1,
  },
  albumTitle: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  albumMeta: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.regular,
    color: colors.text.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  addPhotosChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: '#635C57',
  },
  addPhotosText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.text.inverse,
  },
  spacer: {
    flex: 1,
  },
  pageNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing['3xl'],
    marginBottom: spacing['2xl'],
  },
  navArrow: {
    padding: spacing.sm,
    width: 40,
    alignItems: 'center',
  },
  pageIndicator: {
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    fontWeight: typography.weights.regular,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing['3xl'],
    gap: spacing.md,
    marginBottom: spacing['4xl'],
    width: '100%',
    alignItems: 'center',
  },
  buyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: borderRadius.full,
    backgroundColor: colors.button.primary,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  buyButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  buyButtonIcon: {
    width: 18,
    height: 18,
    tintColor: colors.text.inverse,
  },
  saveButton: {
    height: 52,
    paddingHorizontal: spacing['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: '#635C57',
    minWidth: 110,
  },
  saveButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
});
